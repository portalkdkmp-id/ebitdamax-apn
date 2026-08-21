<?php

namespace App\Http\Controllers;

use App\Actions\StoreTaskReportDocumentsAction;
use App\Actions\SyncKdkmpActualRevenueAction;
use App\Enums\TaskAdditionalFieldInputType;
use App\Enums\TaskAdditionalFieldShowWhen;
use App\Enums\TaskPeriod;
use App\Enums\TaskReportStatus;
use App\Http\Requests\FinishTaskRequest;
use App\Http\Requests\StartTaskRequest;
use App\Models\EbitdamaxKdkmp;
use App\Models\Task;
use App\Models\TaskAdditionalField;
use App\Models\TaskReport;
use App\Models\TaskReportValue;
use App\Models\User;
use App\Services\KdkmpOperationalAllocationService;
use App\Services\KdkmpTaskSelectionService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class TaskReportController extends Controller
{
    public function __construct(
        private readonly StoreTaskReportDocumentsAction $storeTaskReportDocuments,
        private readonly KdkmpOperationalAllocationService $operationalAllocation,
        private readonly KdkmpTaskSelectionService $taskSelection,
        private readonly SyncKdkmpActualRevenueAction $syncKdkmpActualRevenue,
    ) {}

    public function start(StartTaskRequest $request, Task $task): RedirectResponse
    {
        abort_unless($this->canAccessTask($request, $task), 403);

        $periodKey = $this->periodKey($task->period, now());
        $businessDate = $this->businessDate();
        $storedFiles = [];

        try {
            DB::transaction(function () use ($businessDate, $request, $task, $periodKey, &$storedFiles): void {
                $completedReportExists = TaskReport::query()
                    ->where('task_id', $task->id)
                    ->where('user_id', $request->user()->id)
                    ->where('period_key', $periodKey)
                    ->where('status', TaskReportStatus::Completed->value)
                    ->exists();

                if ($completedReportExists) {
                    throw ValidationException::withMessages([
                        'task' => 'Task sudah diselesaikan untuk periode ini.',
                    ]);
                }

                $attendanceEntry = $this->lockedOperationalAttendanceForStart(
                    request: $request,
                    businessDate: $businessDate,
                );
                $this->ensureTaskSelectionForStart(
                    request: $request,
                    task: $task,
                    businessDate: $businessDate,
                );
                $report = TaskReport::query()
                    ->where('task_id', $task->id)
                    ->where('user_id', $request->user()->id)
                    ->where('period_key', $periodKey)
                    ->where('status', TaskReportStatus::InProgress->value)
                    ->lockForUpdate()
                    ->first();
                $memberAllocations = $this->memberAllocationsForStart(
                    request: $request,
                    attendanceEntry: $attendanceEntry,
                    businessDate: $businessDate,
                    exceptTaskReportId: $report?->id,
                );

                if (! $report) {
                    $report = TaskReport::query()->create([
                        'task_id' => $task->id,
                        'user_id' => $request->user()->id,
                        'period_key' => $periodKey,
                        'member_allocations' => $memberAllocations,
                        'started_at' => now(),
                        'status' => TaskReportStatus::InProgress,
                    ]);
                }

                $documents = $request->file('documents', []);
                $this->ensureDocumentLimit($report->started_documents, $documents);

                $photoDisk = (string) config('filesystems.default');
                $photoPath = $request->file('started_photo')->store('task-reports/start', $photoDisk);

                if ($photoPath === false) {
                    throw new RuntimeException('Foto mulai task gagal disimpan.');
                }

                $storedFiles[] = ['disk' => $photoDisk, 'path' => $photoPath];
                $newDocuments = $this->storeTaskReportDocuments->execute($report, $documents, 'start');
                $storedFiles = [...$storedFiles, ...$this->fileReferences($newDocuments)];

                $reportPayload = [
                    'started_photo' => $photoPath,
                    'started_documents' => [
                        ...($report->started_documents ?? []),
                        ...$newDocuments,
                    ],
                    'started_at' => $report->started_at ?? now(),
                    'status' => TaskReportStatus::InProgress,
                ];

                if ($memberAllocations !== null) {
                    $reportPayload['member_allocations'] = $memberAllocations;
                }

                $report->update($reportPayload);

                $this->syncValues(
                    report: $report,
                    task: $task,
                    values: $request->validated('values', []),
                    showWhen: TaskAdditionalFieldShowWhen::Start,
                    storedFiles: $storedFiles,
                );
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedFiles);

            throw $exception;
        }

        return back()->with('success', 'Task berhasil dimulai.');
    }

    public function finish(FinishTaskRequest $request, Task $task): RedirectResponse
    {
        abort_unless($this->canAccessTask($request, $task), 403);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $periodKey = $this->periodKey($task->period, now());
        $businessDate = $this->businessDate();
        $storedFiles = [];

        try {
            DB::transaction(function () use ($businessDate, $request, $task, $periodKey, $user, &$storedFiles): void {
                $report = TaskReport::query()
                    ->where('task_id', $task->id)
                    ->where('user_id', $request->user()->id)
                    ->where('period_key', $periodKey)
                    ->where('status', TaskReportStatus::InProgress->value)
                    ->latest('started_at')
                    ->firstOrFail();

                $documents = $request->file('documents', []);
                $this->ensureDocumentLimit($report->finished_documents, $documents);

                $photoDisk = (string) config('filesystems.default');
                $photoPath = $request->file('finished_photo')->store('task-reports/finish', $photoDisk);

                if ($photoPath === false) {
                    throw new RuntimeException('Foto selesai task gagal disimpan.');
                }

                $storedFiles[] = ['disk' => $photoDisk, 'path' => $photoPath];
                $newDocuments = $this->storeTaskReportDocuments->execute($report, $documents, 'finish');
                $storedFiles = [...$storedFiles, ...$this->fileReferences($newDocuments)];
                $finishedAt = now();

                $report->update([
                    'finished_photo' => $photoPath,
                    'finished_documents' => [
                        ...($report->finished_documents ?? []),
                        ...$newDocuments,
                    ],
                    'finished_at' => $finishedAt,
                    'duration_minutes' => $report->started_at
                        ? max(0, (int) floor($report->started_at->diffInSeconds($finishedAt) / 60))
                        : null,
                    'status' => TaskReportStatus::Completed,
                ]);

                $this->syncValues(
                    report: $report,
                    task: $task,
                    values: $request->validated('values', []),
                    showWhen: TaskAdditionalFieldShowWhen::Finish,
                    storedFiles: $storedFiles,
                );

                $this->syncKdkmpActualRevenue->handle($user, $businessDate);
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedFiles);

            throw $exception;
        }

        return back()->with('success', 'Task berhasil diselesaikan.');
    }

    private function lockedOperationalAttendanceForStart(
        StartTaskRequest $request,
        CarbonImmutable $businessDate,
    ): ?EbitdamaxKdkmp {
        $user = $request->user();

        if (! $user instanceof User || ! $user->isKdkmpManager()) {
            return null;
        }

        if ($user->sdm_kdkmp_entry_id === null) {
            throw ValidationException::withMessages([
                'member_allocations' => 'Akun Manager belum terhubung ke data KDKMP.',
            ]);
        }

        $attendanceEntry = EbitdamaxKdkmp::query()
            ->where('sdm_kdkmp_entry_id', $user->sdm_kdkmp_entry_id)
            ->whereDate('report_date', $businessDate->toDateString())
            ->lockForUpdate()
            ->first();

        if (! $attendanceEntry?->hasConfirmedOperationalAttendance()) {
            throw ValidationException::withMessages([
                'member_allocations' => 'Simpan kehadiran anggota hari ini terlebih dahulu sebelum memulai task.',
            ]);
        }

        return $attendanceEntry;
    }

    /**
     * @return array<string, int>|null
     */
    private function memberAllocationsForStart(
        StartTaskRequest $request,
        ?EbitdamaxKdkmp $attendanceEntry,
        CarbonImmutable $businessDate,
        ?int $exceptTaskReportId,
    ): ?array {
        $user = $request->user();

        if (! $user instanceof User || ! $user->isKdkmpManager()) {
            return null;
        }

        $allocations = $request->memberAllocations();
        $allocationSummary = $this->operationalAllocation->summaryForUser(
            user: $user,
            businessDate: $businessDate,
            attendance: $attendanceEntry?->operational_attendance,
            exceptTaskReportId: $exceptTaskReportId,
            lockForUpdate: true,
        );
        $errors = [];

        foreach (EbitdamaxKdkmp::OPERATIONAL_ATTENDANCE_ROLES as $key => $label) {
            if ($allocations[$key] > $allocationSummary['available'][$key]) {
                $errors["member_allocations.{$key}"] = "Jumlah alokasi {$label} melebihi sisa anggota yang tersedia (Sisa: {$allocationSummary['available'][$key]}).";
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $allocations;
    }

    /**
     * @param  array<string, mixed>  $values
     * @param  array<int, array{disk: string, path: string}>  $storedFiles
     */
    private function syncValues(
        TaskReport $report,
        Task $task,
        array $values,
        TaskAdditionalFieldShowWhen $showWhen,
        array &$storedFiles,
    ): void {
        $fields = TaskAdditionalField::query()
            ->where('task_id', $task->id)
            ->where('show_when', $showWhen->value)
            ->get();

        foreach ($fields as $field) {
            $value = $values[$field->field_name] ?? null;

            if ($field->input_type === TaskAdditionalFieldInputType::File) {
                if (! $value instanceof UploadedFile) {
                    if ($field->is_required) {
                        throw ValidationException::withMessages([
                            "values.{$field->field_name}" => "{$field->label} wajib diisi.",
                        ]);
                    }

                    continue;
                }

                $storedDocument = $this->storeTaskReportDocuments->storeAdditionalField(
                    taskReport: $report,
                    field: $field,
                    file: $value,
                    phase: $showWhen->value,
                );
                $storedFiles[] = [
                    'disk' => $storedDocument['disk'],
                    'path' => $storedDocument['path'],
                ];
                $value = json_encode($storedDocument, JSON_THROW_ON_ERROR);
            }

            if ($field->is_required && $this->isEmptyValue($value)) {
                throw ValidationException::withMessages([
                    "values.{$field->field_name}" => "{$field->label} wajib diisi.",
                ]);
            }

            TaskReportValue::query()->updateOrCreate(
                [
                    'task_report_id' => $report->id,
                    'task_additional_field_id' => $field->id,
                ],
                [
                    'value' => is_array($value) ? json_encode($value) : $value,
                ]
            );
        }
    }

    private function isEmptyValue(mixed $value): bool
    {
        if (is_array($value)) {
            return Arr::where($value, fn (mixed $item): bool => ! $this->isEmptyValue($item)) === [];
        }

        return $value === null || $value === '';
    }

    /**
     * @param  array<int, mixed>|null  $storedDocuments
     * @param  array<int, mixed>  $newDocuments
     */
    private function ensureDocumentLimit(?array $storedDocuments, array $newDocuments): void
    {
        if (count($storedDocuments ?? []) + count($newDocuments) > 10) {
            throw ValidationException::withMessages([
                'documents' => 'Total dokumen untuk tahap ini maksimal 10 file.',
            ]);
        }
    }

    /**
     * @param  array<int, array{disk: string, path: string, original_name: string, mime_type: string|null, size: int}>  $documents
     * @return array<int, array{disk: string, path: string}>
     */
    private function fileReferences(array $documents): array
    {
        return array_map(
            fn (array $document): array => [
                'disk' => $document['disk'],
                'path' => $document['path'],
            ],
            $documents
        );
    }

    /**
     * @param  array<int, array{disk: string, path: string}>  $storedFiles
     */
    private function deleteStoredFiles(array $storedFiles): void
    {
        foreach ($storedFiles as $storedFile) {
            Storage::disk($storedFile['disk'])->delete($storedFile['path']);
        }
    }

    private function canAccessTask(StartTaskRequest|FinishTaskRequest $request, Task $task): bool
    {
        $user = $request->user();
        $roleId = $user?->role_id;

        if ($roleId === null || ! $task->roles()->whereKey($roleId)->exists()) {
            return false;
        }

        return ! ($request instanceof StartTaskRequest)
            || ! $user instanceof User
            || $this->taskSelection->canStartTask(
                $user,
                $task,
                $this->businessDate(),
            );
    }

    private function ensureTaskSelectionForStart(
        StartTaskRequest $request,
        Task $task,
        CarbonImmutable $businessDate,
    ): void {
        $user = $request->user();

        if (
            ! $user instanceof User
            || $this->taskSelection->canStartTask($user, $task, $businessDate)
        ) {
            return;
        }

        throw ValidationException::withMessages([
            'task' => 'Task pilihan belum dipilih untuk dilaksanakan hari ini.',
        ]);
    }

    private function businessDate(): CarbonImmutable
    {
        return CarbonImmutable::now((string) config('app.kdkmp_business_timezone'));
    }

    private function periodKey(TaskPeriod $period, CarbonInterface $date): string
    {
        return match ($period) {
            TaskPeriod::Once => 'once',
            TaskPeriod::Daily => $date->toDateString(),
            TaskPeriod::Weekly => $date->isoWeekYear().'-W'.str_pad((string) $date->isoWeek(), 2, '0', STR_PAD_LEFT),
            TaskPeriod::Monthly => $date->format('Y-m'),
        };
    }
}
