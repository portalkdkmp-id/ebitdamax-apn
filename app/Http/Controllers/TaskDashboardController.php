<?php

namespace App\Http\Controllers;

use App\Enums\RoleLevel;
use App\Enums\TaskPeriod;
use App\Enums\TaskReportStatus;
use App\Models\EbitdamaxKdkmp;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskAdditionalField;
use App\Models\TaskReport;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class TaskDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $tasks = Task::query()
            ->with(['taskCategory', 'roles', 'additionalFields'])
            ->active()
            ->when(
                $user?->role_id,
                fn ($query) => $query->whereHas('roles', fn ($roleQuery) => $roleQuery->whereKey($user->role_id)),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->orderByRaw('CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $periodKeysByTaskId = $tasks
            ->mapWithKeys(fn (Task $task): array => [
                $task->id => $this->periodKey($task->period, now()),
            ]);

        $reportByTaskAndPeriod = TaskReport::query()
            ->where('user_id', $user?->id)
            ->whereIn('task_id', $tasks->pluck('id'))
            ->whereIn('period_key', $periodKeysByTaskId->values()->unique())
            ->latest('created_at')
            ->get()
            ->unique(fn (TaskReport $report): string => $report->task_id.'|'.$report->period_key)
            ->keyBy(fn (TaskReport $report): string => $report->task_id.'|'.$report->period_key);

        $tasks = $tasks
            ->map(function (Task $task) use ($periodKeysByTaskId, $reportByTaskAndPeriod, $user): ?array {
                $periodKey = $periodKeysByTaskId->get($task->id);
                $report = $reportByTaskAndPeriod->get($task->id.'|'.$periodKey);

                $isSuperadmin = $user?->role?->level === RoleLevel::Superadmin;
                if (! $isSuperadmin && $report?->status === TaskReportStatus::Completed) {
                    return null;
                }

                return $this->transformTask($task, $report, $periodKey);
            })
            ->filter()
            ->values();

        return Inertia::render('TaskDashboard/Index', [
            'tasks' => $tasks,
            'operationalAttendance' => $this->operationalAttendanceForUser($user),
            'summary' => [
                'total' => $tasks->count(),
                'pending' => $tasks->where('status', 'pending')->count(),
                'in_progress' => $tasks->where('status', 'in_progress')->count(),
                'completed' => $tasks->where('status', 'completed')->count(),
            ],
        ]);
    }

    /**
     * @return array{business_date: string, is_saved: bool, values: array<string, int>}|null
     */
    private function operationalAttendanceForUser(mixed $user): ?array
    {
        if (! $user instanceof User || ! $user->isKdkmpManager()) {
            return null;
        }

        $businessDate = CarbonImmutable::now((string) config('app.kdkmp_business_timezone'));
        $attendanceEntry = $user->sdm_kdkmp_entry_id === null
            ? null
            : EbitdamaxKdkmp::query()
                ->where('sdm_kdkmp_entry_id', $user->sdm_kdkmp_entry_id)
                ->whereDate('report_date', $businessDate->toDateString())
                ->first();

        return [
            'business_date' => $businessDate->toDateString(),
            'is_saved' => $attendanceEntry?->hasConfirmedOperationalAttendance() ?? false,
            'values' => EbitdamaxKdkmp::normalizeOperationalAttendance(
                $attendanceEntry?->operational_attendance,
            ),
        ];
    }

    public function completed(Request $request): Response
    {
        $user = $request->user();
        $isSuperadmin = $user?->role?->level === RoleLevel::Superadmin;
        $historyStart = now()->subDays(13)->startOfDay();
        $historyEnd = now()->endOfDay();

        $reports = TaskReport::query()
            ->with(['task.taskCategory', 'task.roles', 'user'])
            ->when(! $isSuperadmin, fn ($query) => $query->where('user_id', $user?->id))
            ->where('status', TaskReportStatus::Completed->value)
            ->whereNotNull('finished_at')
            ->whereBetween('finished_at', [$historyStart, $historyEnd])
            ->latest('finished_at')
            ->get();

        $tasksByRole = $this->activeTasksByRole();
        $dailyReports = $reports
            ->groupBy(fn (TaskReport $report): string => $report->finished_at->toDateString())
            ->map(fn (Collection $dayReports, string $date): array => $this->transformDailySummary(
                date: $date,
                dayReports: $dayReports,
                user: $user,
                isSuperadmin: $isSuperadmin,
                tasksByRole: $tasksByRole,
            ))
            ->sortByDesc('date')
            ->values();

        $perPage = 15;
        $page = LengthAwarePaginator::resolveCurrentPage();
        $paginatedDailyReports = new LengthAwarePaginator(
            items: $dailyReports->forPage($page, $perPage)->values(),
            total: $dailyReports->count(),
            perPage: $perPage,
            currentPage: $page,
            options: [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );

        return Inertia::render('TaskDashboard/Completed', [
            'reports' => $paginatedDailyReports,
            'isSuperadmin' => $isSuperadmin,
        ]);
    }

    /**
     * @return Collection<int, Collection<int, Task>>
     */
    private function activeTasksByRole(): Collection
    {
        $tasks = Task::query()
            ->with(['taskCategory', 'roles'])
            ->active()
            ->get([
                'id',
                'uuid',
                'task_category_id',
                'name',
                'description',
                'time_require',
                'period',
            ]);

        $tasksByRole = collect();

        foreach ($tasks as $task) {
            foreach ($task->roles as $role) {
                $roleId = (int) $role->id;
                $tasksByRole->put(
                    $roleId,
                    $tasksByRole->get($roleId, collect())->push($task),
                );
            }
        }

        return $tasksByRole;
    }

    /**
     * @param  Collection<int, TaskReport>  $dayReports
     * @param  Collection<int, Collection<int, Task>>  $tasksByRole
     * @return array<string, mixed>
     */
    private function transformDailySummary(
        string $date,
        Collection $dayReports,
        ?User $user,
        bool $isSuperadmin,
        Collection $tasksByRole,
    ): array {
        $expectedTasks = $this->expectedTasksForDay(
            dayReports: $dayReports,
            user: $user,
            isSuperadmin: $isSuperadmin,
            tasksByRole: $tasksByRole,
        );
        $completedReports = $dayReports
            ->unique(fn (TaskReport $report): string => $this->reportKey($report))
            ->values();
        $completedKeys = $completedReports
            ->mapWithKeys(fn (TaskReport $report): array => [
                $this->reportKey($report) => true,
            ]);
        $onTimeReports = $completedReports->filter(
            fn (TaskReport $report): bool => $this->isReportOnTime($report),
        );
        $lateReports = $completedReports->reject(
            fn (TaskReport $report): bool => $this->isReportOnTime($report),
        );

        return [
            'date' => $date,
            'total_tasks' => $expectedTasks->count(),
            'on_time_tasks' => $onTimeReports->count(),
            'late_tasks' => $lateReports->count(),
            'not_worked_tasks' => $expectedTasks
                ->reject(fn (array $assignment, string $key): bool => $completedKeys->has($key))
                ->map(fn (array $assignment): array => [
                    'task' => $this->transformTaskReference($assignment['task']),
                    'user' => $this->transformUserReference($assignment['user']),
                ])
                ->values()
                ->all(),
            'completed_reports' => $completedReports
                ->map(fn (TaskReport $report): array => $this->transformCompletedReport($report, $isSuperadmin))
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  Collection<int, TaskReport>  $dayReports
     * @param  Collection<int, Collection<int, Task>>  $tasksByRole
     * @return Collection<string, array{user_id: int, task: Task, user: User|null}>
     */
    private function expectedTasksForDay(
        Collection $dayReports,
        ?User $user,
        bool $isSuperadmin,
        Collection $tasksByRole,
    ): Collection {
        $usersById = $dayReports
            ->mapWithKeys(fn (TaskReport $report): array => [
                (int) $report->user_id => $report->user,
            ])
            ->filter();
        $userIds = $isSuperadmin
            ? $usersById->keys()
            : collect([$user?->id])->filter();
        $expectedTasks = collect();

        foreach ($userIds as $userId) {
            $participant = $usersById->get((int) $userId);
            $roleId = $isSuperadmin
                ? $participant?->role_id
                : $user?->role_id;

            if ($roleId === null) {
                continue;
            }

            foreach ($tasksByRole->get((int) $roleId, collect()) as $task) {
                $expectedTasks->put($this->assignmentKey((int) $userId, $task), [
                    'user_id' => (int) $userId,
                    'task' => $task,
                    'user' => $isSuperadmin ? $participant : null,
                ]);
            }
        }

        return $expectedTasks;
    }

    private function assignmentKey(int $userId, Task $task): string
    {
        return $userId.'|'.$task->id;
    }

    private function reportKey(TaskReport $report): string
    {
        return $this->assignmentKey((int) $report->user_id, $report->task);
    }

    private function isReportOnTime(TaskReport $report): bool
    {
        return $report->duration_minutes !== null
            && $report->duration_minutes <= $report->task->time_require;
    }

    /**
     * @return array<string, mixed>
     */
    private function transformCompletedReport(TaskReport $report, bool $isSuperadmin): array
    {
        $isOnTime = $this->isReportOnTime($report);

        return [
            'id' => $report->id,
            'uuid' => $report->uuid,
            'started_at' => $report->started_at?->toIso8601String(),
            'finished_at' => $report->finished_at?->toIso8601String(),
            'duration_minutes' => $report->duration_minutes,
            'status_label' => $report->status->label(),
            'timing_status' => $isOnTime ? 'on_time' : 'late',
            'timing_label' => $isOnTime ? 'Tepat Waktu' : 'Terlambat',
            'documents' => $this->transformDocuments($report),
            'task' => $this->transformTaskReference($report->task),
            'user' => $isSuperadmin ? $this->transformUserReference($report->user) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformTaskReference(Task $task): array
    {
        return [
            'id' => $task->id,
            'uuid' => $task->uuid,
            'name' => $task->name,
            'description' => $task->description,
            'time_require' => $task->time_require,
            'task_category' => [
                'id' => $task->taskCategory->id,
                'name' => $task->taskCategory->name,
                'slug' => $task->taskCategory->slug,
            ],
            'roles' => $task->roles
                ->map(fn (Role $role): array => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'level' => $role->level->value,
                    'level_label' => $role->level->label(),
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function transformUserReference(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformTask(Task $task, ?TaskReport $report, string $periodKey): array
    {
        $status = $report?->status;
        $firstRole = $task->roles->first();

        return [
            'id' => $task->id,
            'uuid' => $task->uuid,
            'sort_order' => $task->sort_order,
            'name' => $task->name,
            'description' => $task->description,
            'execution_time' => $task->execution_time
                ? substr((string) $task->execution_time, 0, 5)
                : null,
            'time_require' => $task->time_require,
            'lower_time_threshold_minutes' => $task->lower_time_threshold_minutes,
            'upper_time_threshold_minutes' => $task->upper_time_threshold_minutes,
            'period' => $task->period->value,
            'period_label' => $task->period->label(),
            'period_key' => $periodKey,
            'status' => $status?->value ?? 'pending',
            'status_label' => $status?->label() ?? 'Belum Dimulai',
            'documents' => $report ? $this->transformDocuments($report) : [],
            'task_category' => [
                'id' => $task->taskCategory->id,
                'name' => $task->taskCategory->name,
                'slug' => $task->taskCategory->slug,
            ],
            'role' => $firstRole ? [
                'id' => $firstRole->id,
                'name' => $firstRole->name,
                'slug' => $firstRole->slug,
                'level' => $firstRole->level->value,
                'level_label' => $firstRole->level->label(),
            ] : null,
            'roles' => $task->roles
                ->map(fn (Role $role): array => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'level' => $role->level->value,
                    'level_label' => $role->level->label(),
                ])
                ->values()
                ->all(),
            'additional_fields' => $task->additionalFields
                ->map(fn (TaskAdditionalField $field): array => [
                    'id' => $field->id,
                    'label' => $field->label,
                    'field_name' => $field->field_name,
                    'input_type' => $field->input_type->value,
                    'show_when' => $field->show_when->value,
                    'is_required' => $field->is_required,
                    'options' => $field->options ?? [],
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<int, array{phase: string, phase_label: string, name: string, mime_type: string|null, size: int, preview_url: string, download_url: string}>
     */
    private function transformDocuments(TaskReport $taskReport): array
    {
        return collect([
            'start' => $taskReport->started_documents ?? [],
            'finish' => $taskReport->finished_documents ?? [],
        ])->flatMap(function (array $documents, string $phase) use ($taskReport): array {
            return collect($documents)
                ->map(function (mixed $document, int $documentIndex) use ($taskReport, $phase): ?array {
                    if (! is_array($document) || ! isset($document['original_name'], $document['size'])) {
                        return null;
                    }

                    $routeParameters = [
                        'taskReport' => $taskReport,
                        'phase' => $phase,
                        'documentIndex' => $documentIndex,
                    ];

                    return [
                        'phase' => $phase,
                        'phase_label' => $phase === 'start' ? 'Mulai' : 'Selesai',
                        'name' => (string) $document['original_name'],
                        'mime_type' => isset($document['mime_type']) ? (string) $document['mime_type'] : null,
                        'size' => (int) $document['size'],
                        'preview_url' => route(
                            'task-reports.documents.preview',
                            $routeParameters,
                            absolute: false
                        ),
                        'download_url' => route(
                            'task-reports.documents.download',
                            $routeParameters,
                            absolute: false
                        ),
                    ];
                })
                ->filter()
                ->values()
                ->all();
        })->values()->all();
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
