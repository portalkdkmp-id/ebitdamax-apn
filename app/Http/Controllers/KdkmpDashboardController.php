<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveEbitdamaxKdkmpRequest;
use App\Http\Requests\SaveOperationalAttendanceRequest;
use App\Models\EbitdamaxKdkmp;
use App\Models\SdmKdkmpEntry;
use App\Models\User;
use App\Services\KdkmpDashboardMetricsService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class KdkmpDashboardController extends Controller
{
    public function __construct(
        private readonly KdkmpDashboardMetricsService $dashboardMetrics,
    ) {}

    public function index(Request $request): Response
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
                $todayEntry?->actual_revenue,
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
            'kdkmp' => $sdmKdkmpEntry
                ? $this->transformKdkmp($sdmKdkmpEntry)
                : null,
            'todayEntry' => $todayEntry
                ? $this->transformEntry($todayEntry, $computedValues)
                : null,
            'computedValues' => $computedValues,
            'history' => $history,
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
        $planRevenueCategories = $request->planRevenueCategories();
        $planRevenue = EbitdamaxKdkmp::calculatePlanRevenue($planRevenueCategories);
        $actualRevenue = $request->validated('actual_revenue');
        $payload = [
            ...$planRevenueCategories,
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

        foreach (EbitdamaxKdkmp::EDITABLE_FIELDS as $field) {
            $payload[$field] = $request->validated($field);
        }

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

        $entry = EbitdamaxKdkmp::query()->firstOrNew([
            'sdm_kdkmp_entry_id' => $user->sdm_kdkmp_entry_id,
            'report_date' => $this->businessDate()->toDateString(),
        ]);

        if (! $entry->exists) {
            $entry->created_by = $user->id;
        }

        $entry->fill([
            'operational_attendance' => $request->operationalAttendance(),
            'operational_attendance_saved_at' => now(),
            'updated_by' => $user->id,
        ]);
        $entry->save();

        return back()->with('success', 'Kehadiran anggota hari ini berhasil disimpan.');
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
            $data[$field] = $overrides[$field] ?? $entry->getAttribute($field);
        }

        foreach (array_keys(EbitdamaxKdkmp::PLAN_REVENUE_CATEGORIES) as $field) {
            $data[$field] = $entry->getAttribute($field);
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

    private function businessDate(): CarbonImmutable
    {
        return CarbonImmutable::now((string) config('app.kdkmp_business_timezone'));
    }
}
