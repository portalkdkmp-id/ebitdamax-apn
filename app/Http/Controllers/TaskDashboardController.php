<?php

namespace App\Http\Controllers;

use App\Enums\RoleLevel;
use App\Enums\TaskPeriod;
use App\Enums\TaskReportStatus;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskAdditionalField;
use App\Models\TaskReport;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
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
            ->orderBy('name')
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
                if (!$isSuperadmin && $report?->status === TaskReportStatus::Completed) {
                    return null;
                }

                return $this->transformTask($task, $report, $periodKey);
            })
            ->filter()
            ->values();

        return Inertia::render('TaskDashboard/Index', [
            'tasks' => $tasks,
            'summary' => [
                'total' => $tasks->count(),
                'pending' => $tasks->where('status', 'pending')->count(),
                'in_progress' => $tasks->where('status', 'in_progress')->count(),
                'completed' => $tasks->where('status', 'completed')->count(),
            ],
        ]);
    }

    public function completed(Request $request): Response
    {
        $user = $request->user();
        $isSuperadmin = $user?->role?->level === RoleLevel::Superadmin;

        $reports = TaskReport::query()
            ->with(['task.taskCategory', 'task.roles', 'user'])
            ->when(! $isSuperadmin, fn ($query) => $query->where('user_id', $user?->id))
            ->where('status', TaskReportStatus::Completed->value)
            ->latest('finished_at')
            ->paginate(15)
            ->through(fn (TaskReport $report): array => [
                'id' => $report->id,
                'uuid' => $report->uuid,
                'started_at' => $report->started_at?->toIso8601String(),
                'finished_at' => $report->finished_at?->toIso8601String(),
                'duration_minutes' => $report->duration_minutes,
                'status_label' => $report->status->label(),
                'documents' => $this->transformDocuments($report),
                'task' => [
                    'id' => $report->task->id,
                    'uuid' => $report->task->uuid,
                    'name' => $report->task->name,
                    'description' => $report->task->description,
                    'time_require' => $report->task->time_require,
                    'lower_time_threshold_minutes' => $report->task->lower_time_threshold_minutes,
                    'upper_time_threshold_minutes' => $report->task->upper_time_threshold_minutes,
                    'task_category' => [
                        'id' => $report->task->taskCategory->id,
                        'name' => $report->task->taskCategory->name,
                        'slug' => $report->task->taskCategory->slug,
                    ],
                    'roles' => $report->task->roles
                        ->map(fn (Role $role): array => [
                            'id' => $role->id,
                            'name' => $role->name,
                            'slug' => $role->slug,
                            'level' => $role->level->value,
                            'level_label' => $role->level->label(),
                        ])
                        ->values()
                        ->all(),
                ],
                'user' => $isSuperadmin ? [
                    'id' => $report->user->id,
                    'name' => $report->user->name,
                    'username' => $report->user->username,
                    'email' => $report->user->email,
                ] : null,
            ]);

        return Inertia::render('TaskDashboard/Completed', [
            'reports' => $reports,
            'isSuperadmin' => $isSuperadmin,
        ]);
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
            'name' => $task->name,
            'description' => $task->description,
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
