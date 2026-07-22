<?php

namespace App\Http\Controllers;

use App\Enums\RoleLevel;
use App\Enums\TaskReportStatus;
use App\Models\Task;
use App\Models\TaskAdditionalField;
use App\Models\TaskReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $reportByTaskId = TaskReport::query()
            ->where('user_id', $user?->id)
            ->latest('created_at')
            ->get()
            ->unique('task_id')
            ->keyBy('task_id');

        $tasks = Task::query()
            ->with(['taskCategory', 'role', 'additionalFields'])
            ->active()
            ->when(
                $user?->role_id,
                fn ($query) => $query->where('role_id', $user->role_id),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->orderBy('name')
            ->get()
            ->map(fn (Task $task): array => $this->transformTask($task, $reportByTaskId->get($task->id)))
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
            ->with(['task.taskCategory', 'task.role'])
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
                'task' => [
                    'id' => $report->task->id,
                    'uuid' => $report->task->uuid,
                    'name' => $report->task->name,
                    'description' => $report->task->description,
                    'time_require' => $report->task->time_require,
                    'task_category' => [
                        'id' => $report->task->taskCategory->id,
                        'name' => $report->task->taskCategory->name,
                        'slug' => $report->task->taskCategory->slug,
                    ],
                    'role' => [
                        'id' => $report->task->role->id,
                        'name' => $report->task->role->name,
                        'slug' => $report->task->role->slug,
                        'level' => $report->task->role->level->value,
                        'level_label' => $report->task->role->level->label(),
                    ],
                ],
            ]);

        return Inertia::render('TaskDashboard/Completed', [
            'reports' => $reports,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformTask(Task $task, ?TaskReport $report): array
    {
        $status = $report?->status;

        return [
            'id' => $task->id,
            'uuid' => $task->uuid,
            'name' => $task->name,
            'description' => $task->description,
            'time_require' => $task->time_require,
            'status' => $status?->value ?? 'pending',
            'status_label' => $status?->label() ?? 'Belum Dimulai',
            'task_category' => [
                'id' => $task->taskCategory->id,
                'name' => $task->taskCategory->name,
                'slug' => $task->taskCategory->slug,
            ],
            'role' => [
                'id' => $task->role->id,
                'name' => $task->role->name,
                'slug' => $task->role->slug,
                'level' => $task->role->level->value,
                'level_label' => $task->role->level->label(),
            ],
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
}
