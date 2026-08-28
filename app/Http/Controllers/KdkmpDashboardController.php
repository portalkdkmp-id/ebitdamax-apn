<?php

namespace App\Http\Controllers;

use App\Actions\SyncKdkmpActualVariableCostAction;
use App\Http\Requests\SaveEbitdamaxKdkmpRequest;
use App\Http\Requests\SaveOperationalAttendanceRequest;
use App\Http\Requests\UpdateKdkmpTaskSelectionRequest;
use App\Http\Requests\ViewKdkmpDashboardRequest;
use App\Models\EbitdamaxKdkmp;
use App\Models\SdmKdkmpEntry;
use App\Models\Task;
use App\Models\User;
use App\Services\KdkmpActualVariableCostService;
use App\Services\KdkmpDashboardMetricsService;
use App\Services\KdkmpFinancialMatrixService;
use App\Services\KdkmpOperationalAllocationService;
use App\Services\KdkmpTaskSelectionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class KdkmpDashboardController extends Controller
{
    public function __construct(
        private readonly SyncKdkmpActualVariableCostAction $syncActualVariableCost,
        private readonly KdkmpActualVariableCostService $actualVariableCost,
        private readonly KdkmpDashboardMetricsService $dashboardMetrics,
        private readonly KdkmpFinancialMatrixService $financialMatrix,
        private readonly KdkmpOperationalAllocationService $operationalAllocation,
        private readonly KdkmpTaskSelectionService $taskSelection,
    ) {}

    public function index(ViewKdkmpDashboardRequest $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $businessDate = $this->businessDate();
        $financialMatrixDate = CarbonImmutable::createFromFormat(
            'Y-m-d',
            (string) ($request->validated('date') ?? $businessDate->toDateString()),
            (string) config('app.kdkmp_business_timezone')
        )->startOfDay();
        $sdmKdkmpEntry = $user->sdmKdkmpEntry;
        $todayEntry = $sdmKdkmpEntry
            ? $sdmKdkmpEntry->dailyEbitdaRecords()
                ->whereDate('report_date', $businessDate->toDateString())
                ->first()
            : null;
        $todayEntry = $this->syncActualVariableCost->handle($user, $businessDate) ?? $todayEntry;
        $metrics = $this->dashboardMetrics->forUser($user->id, $businessDate);
        $isTodayFinancialMatrix = $financialMatrixDate->isSameDay($businessDate);
        $financialMatrixEntry = $isTodayFinancialMatrix
            ? $todayEntry
            : $sdmKdkmpEntry?->dailyEbitdaRecords()
                ->whereDate('report_date', $financialMatrixDate->toDateString())
                ->first();
        $financialMatrixMetrics = $isTodayFinancialMatrix
            ? $metrics
            : $this->dashboardMetrics->forUser($user->id, $financialMatrixDate);
        $financialMatrixActualVariableCost = $isTodayFinancialMatrix
            ? $todayEntry?->actual_variable_cost
            : $this->actualVariableCost->forUser($user->id, $financialMatrixDate);
        $computedValues = [
            'target_revenue' => EbitdamaxKdkmp::TARGET_REVENUE,
            ...$metrics,
            'performance_scoring' => EbitdamaxKdkmp::calculatePerformanceScoring(
                $todayEntry?->plan_revenue,
                $metrics['actual_revenue'],
                $metrics['task_completion_rate'],
                $metrics['time_compliance_rate'],
            ),
        ];

        $history = EbitdamaxKdkmp::query()
            ->when(
                $sdmKdkmpEntry,
                fn ($query) => $query->where('sdm_kdkmp_entry_id', $sdmKdkmpEntry->id),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->whereDate('report_date', '<', $businessDate->toDateString())
            ->orderByDesc('report_date')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (EbitdamaxKdkmp $entry): array => $this->transformEntry($entry));

        return Inertia::render('KdkmpDashboard/Index', [
            'businessDate' => $businessDate->toDateString(),
            'financialMatrixDate' => $financialMatrixDate->toDateString(),
            'kdkmp' => $sdmKdkmpEntry
                ? $this->transformKdkmp($sdmKdkmpEntry)
                : null,
            'todayEntry' => $todayEntry
                ? $this->transformEntry($todayEntry, $computedValues)
                : null,
            'computedValues' => $computedValues,
            'financialMatrix' => $this->financialMatrix->forUser(
                user: $user,
                businessDate: $financialMatrixDate,
                planRevenue: $financialMatrixEntry?->plan_revenue,
                actualRevenue: $financialMatrixMetrics['actual_revenue'],
                actualVariableCostOverage: $financialMatrixActualVariableCost,
            ),
            'history' => $history,
        ]);
    }

    public function input(Request $request): Response
    {
        Gate::authorize('viewDashboard', EbitdamaxKdkmp::class);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $businessDate = $this->businessDate();
        $sdmKdkmpEntry = $user->sdmKdkmpEntry;
        $todayEntry = $sdmKdkmpEntry
            ? $sdmKdkmpEntry->dailyEbitdaRecords()
                ->whereDate('report_date', $businessDate->toDateString())
                ->first()
            : null;
        $metrics = $this->dashboardMetrics->forUser($user->id, $businessDate);
        $computedValues = [
            'target_revenue' => EbitdamaxKdkmp::TARGET_REVENUE,
            ...$metrics,
            'performance_scoring' => EbitdamaxKdkmp::calculatePerformanceScoring(
                $todayEntry?->plan_revenue,
                $metrics['actual_revenue'],
                $metrics['task_completion_rate'],
                $metrics['time_compliance_rate'],
            ),
        ];

        return Inertia::render('KdkmpDashboard/Input', [
            'businessDate' => $businessDate->toDateString(),
            'kdkmp' => $sdmKdkmpEntry
                ? $this->transformKdkmp($sdmKdkmpEntry)
                : null,
            'todayEntry' => $todayEntry
                ? $this->transformEntry($todayEntry, $computedValues)
                : null,
            'computedValues' => $computedValues,
            'taskSelection' => [
                'tasks' => $this->taskSelection
                    ->tasksForInput($user, $businessDate)
                    ->map(fn (Task $task): array => $this->transformSelectableTask($task))
                    ->values()
                    ->all(),
                'selected_task_ids' => $this->taskSelection
                    ->executionTaskIdsForUser($user, $businessDate)
                    ->all(),
            ],
        ]);
    }

    public function upsert(SaveEbitdamaxKdkmpRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->sdm_kdkmp_entry_id !== null, 403);

        $businessDate = $this->businessDate();
        $entry = EbitdamaxKdkmp::query()->firstOrNew([
            'sdm_kdkmp_entry_id' => $user->sdm_kdkmp_entry_id,
            'report_date' => $businessDate->toDateString(),
        ]);

        if (! $entry->exists) {
            $entry->created_by = $user->id;
        }

        $metrics = $this->dashboardMetrics->forUser($user->id, $businessDate);
        $planRevenue = $request->validated('plan_revenue');
        $actualRevenue = $metrics['actual_revenue'];
        $payload = [
            'plan_revenue' => $planRevenue,
            'target_revenue' => EbitdamaxKdkmp::TARGET_REVENUE,
            'actual_cost' => $metrics['actual_cost'],
            'actual_ebitda_margin' => EbitdamaxKdkmp::calculateActualEbitdaMargin($actualRevenue),
            'performance_scoring' => EbitdamaxKdkmp::calculatePerformanceScoring(
                $planRevenue,
                $actualRevenue,
                $metrics['task_completion_rate'],
                $metrics['time_compliance_rate'],
            ),
            'total_duration' => $metrics['total_duration'],
            'plan_revenue_requires_review' => EbitdamaxKdkmp::planRevenueRequiresReview($planRevenue),
            'updated_by' => $user->id,
        ];

        $payload['actual_revenue'] = $actualRevenue;
        $payload['plan_cost'] = $request->validated('variable_cost');

        $entry->fill($payload);
        $entry->save();

        $message = match (true) {
            $entry->plan_revenue_requires_review => 'Data berhasil disimpan dan Plan Revenue ditandai untuk direview superadmin.',
            default => 'Dashboard harian KDKMP berhasil disimpan lengkap.',
        };

        return back()->with('success', $message);
    }

    public function saveOperationalAttendance(
        SaveOperationalAttendanceRequest $request
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user instanceof User && $user->sdm_kdkmp_entry_id !== null, 403);

        $businessDate = $this->businessDate();

        DB::transaction(function () use ($businessDate, $request, $user): void {
            $entry = EbitdamaxKdkmp::query()
                ->where('sdm_kdkmp_entry_id', $user->sdm_kdkmp_entry_id)
                ->whereDate('report_date', $businessDate->toDateString())
                ->lockForUpdate()
                ->first();

            if (! $entry) {
                $entry = new EbitdamaxKdkmp([
                    'sdm_kdkmp_entry_id' => $user->sdm_kdkmp_entry_id,
                    'report_date' => $businessDate->toDateString(),
                    'created_by' => $user->id,
                ]);
            }

            $attendance = $request->operationalAttendance();
            $allocationSummary = $this->operationalAllocation->summaryForUser(
                user: $user,
                businessDate: $businessDate,
                attendance: $attendance,
                lockForUpdate: true,
            );
            $errors = [];

            foreach (EbitdamaxKdkmp::OPERATIONAL_ATTENDANCE_ROLES as $key => $label) {
                if ($attendance[$key] < $allocationSummary['allocated'][$key]) {
                    $errors["operational_attendance.{$key}"] = "Jumlah anggota {$label} tidak boleh lebih kecil dari {$allocationSummary['allocated'][$key]} anggota yang sedang dialokasikan.";
                }
            }

            if ($errors !== []) {
                throw ValidationException::withMessages($errors);
            }

            $entry->fill([
                'operational_attendance' => $attendance,
                'operational_attendance_saved_at' => now(),
                'updated_by' => $user->id,
            ]);
            $entry->save();
        });

        return back()->with('success', 'Kehadiran anggota hari ini berhasil disimpan.');
    }

    public function saveTaskSelection(
        UpdateKdkmpTaskSelectionRequest $request
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user instanceof User && $user->sdm_kdkmp_entry_id !== null, 403);

        $businessDate = $this->businessDate();
        $selectedTaskIds = collect($request->validated('selected_task_ids', []))
            ->map(fn (mixed $taskId): int => (int) $taskId)
            ->unique()
            ->values();
        $selectedTaskIds = $this->taskSelection
            ->expandSelectedTaskIdsToBmcBundles($user, $selectedTaskIds)
            ->all();

        DB::transaction(function () use ($businessDate, $selectedTaskIds, $user): void {
            $entry = EbitdamaxKdkmp::query()
                ->where('sdm_kdkmp_entry_id', $user->sdm_kdkmp_entry_id)
                ->whereDate('report_date', $businessDate->toDateString())
                ->lockForUpdate()
                ->first();

            if (! $entry) {
                $entry = new EbitdamaxKdkmp([
                    'sdm_kdkmp_entry_id' => $user->sdm_kdkmp_entry_id,
                    'report_date' => $businessDate->toDateString(),
                    'created_by' => $user->id,
                ]);
            }

            $lockedTaskIds = $this->taskSelection->inProgressTaskIdsForUser($user);

            if ($lockedTaskIds->diff($selectedTaskIds)->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'selected_task_ids' => 'Task yang sedang dikerjakan tidak dapat dilepas dari pilihan hari ini.',
                ]);
            }

            $entry->fill([
                'selected_task_ids' => $selectedTaskIds,
                'updated_by' => $user->id,
            ]);
            $entry->save();
        });

        return back()->with('success', 'Pilihan task hari ini berhasil disimpan.');
    }

    /**
     * @return array<string, array<string, int>|int|float|string|bool|null>
     */
    private function transformEntry(EbitdamaxKdkmp $entry, array $overrides = []): array
    {
        $data = [
            'id' => $entry->id,
            'report_date' => $entry->report_date?->toDateString(),
            'is_complete' => $entry->isComplete(),
            'plan_revenue_requires_review' => $entry->plan_revenue_requires_review,
            'operational_attendance' => EbitdamaxKdkmp::normalizeOperationalAttendance(
                $entry->operational_attendance,
            ),
            'operational_attendance_saved_at' => $entry
                ->operational_attendance_saved_at
                ?->toIso8601String(),
            'updated_at' => $entry->updated_at?->toIso8601String(),
        ];

        foreach (EbitdamaxKdkmp::ACTIVE_FIELDS as $field) {
            if ($field === 'plan_cost') {
                $data['variable_cost'] = $overrides['variable_cost']
                    ?? $entry->plan_cost;

                continue;
            }

            $data[$field] = $overrides[$field] ?? $entry->getAttribute($field);
        }

        $data['actual_ebitda_margin'] = EbitdamaxKdkmp::calculateActualEbitdaMargin(
            is_string($data['actual_revenue']) ? $data['actual_revenue'] : null
        );

        return $data;
    }

    /**
     * @return array<string, int|string|null>
     */
    private function transformKdkmp(SdmKdkmpEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'nik' => $entry->nik,
            'name' => $entry->nama_koperasi,
            'desa' => $entry->desa,
            'kecamatan' => $entry->kecamatan,
            'kota_kabupaten' => $entry->kota_kabupaten,
            'provinsi' => $entry->provinsi,
        ];
    }

    /**
     * @return array<string, bool|int|string|null>
     */
    private function transformSelectableTask(Task $task): array
    {
        return [
            'id' => $task->id,
            'name' => $task->name,
            'description' => $task->description,
            'execution_time' => $task->execution_time
                ? substr((string) $task->execution_time, 0, 5)
                : null,
            'time_require' => $task->time_require,
            'is_mandatory' => $task->is_mandatory,
            'is_locked' => (bool) $task->getAttribute('is_locked_for_today'),
            'bmc_status' => $task->bmc_status->value,
            'bmc_status_label' => $task->bmc_status->label(),
            'task_category_name' => $task->taskCategory?->name,
        ];
    }

    private function businessDate(): CarbonImmutable
    {
        return CarbonImmutable::now((string) config('app.kdkmp_business_timezone'));
    }
}
