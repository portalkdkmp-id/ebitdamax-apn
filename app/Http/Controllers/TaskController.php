<?php

namespace App\Http\Controllers;

use App\Enums\TaskAdditionalFieldInputType;
use App\Enums\TaskAdditionalFieldShowWhen;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskAdditionalField;
use App\Models\TaskCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $categoryId = $request->input('task_category_id');
        $roleId = $request->input('role_id');
        $status = (string) $request->input('status', 'active');
        $sort = (string) $request->input('sort', 'name');
        $direction = (string) $request->input('direction', 'asc');

        $sort = in_array($sort, ['name', 'time_require', 'created_at'], true) ? $sort : 'name';
        $direction = $direction === 'desc' ? 'desc' : 'asc';

        $tasks = Task::query()
            ->with(['taskCategory', 'role', 'additionalFields'])
            ->when($categoryId, fn ($query) => $query->where('task_category_id', $categoryId))
            ->when($roleId, fn ($query) => $query->where('role_id', $roleId))
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($subQuery) use ($search): void {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('taskCategory', fn ($categoryQuery) => $categoryQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('role', fn ($roleQuery) => $roleQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate(15)
            ->through(fn (Task $task): array => $this->transformTask($task))
            ->appends($request->only(['search', 'task_category_id', 'role_id', 'status', 'sort', 'direction']));

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'taskCategories' => $this->taskCategoryOptions(),
            'roles' => $this->roleOptions(),
            'inputTypeOptions' => TaskAdditionalFieldInputType::options(),
            'showWhenOptions' => TaskAdditionalFieldShowWhen::options(),
            'filters' => [
                'search' => $search,
                'task_category_id' => $categoryId ? (int) $categoryId : null,
                'role_id' => $roleId ? (int) $roleId : null,
                'status' => $status,
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $task = Task::query()->create($this->taskPayload($request->validated()));

            $this->syncAdditionalFields($task, $request->validated('additional_fields', []));
        });

        return back()->with('success', 'Task berhasil ditambahkan.');
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        DB::transaction(function () use ($request, $task): void {
            $task->update($this->taskPayload($request->validated()));

            $this->syncAdditionalFields($task, $request->validated('additional_fields', []));
        });

        return back()->with('success', 'Task berhasil diperbarui.');
    }

    public function destroy(Task $task): RedirectResponse
    {
        if (Schema::hasTable('task_reports') && $task->reports()->exists()) {
            return back()->with('error', 'Task tidak dapat dihapus karena sudah memiliki laporan.');
        }

        $task->delete();

        return back()->with('success', 'Task berhasil dihapus.');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function taskPayload(array $payload): array
    {
        return [
            'task_category_id' => $payload['task_category_id'],
            'role_id' => $payload['role_id'],
            'name' => $payload['name'],
            'description' => $payload['description'] ?? null,
            'time_require' => $payload['time_require'],
            'is_active' => $payload['is_active'],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $fields
     */
    private function syncAdditionalFields(Task $task, array $fields): void
    {
        $incomingIds = array_filter(array_column($fields, 'id'), fn ($id) => (int) $id > 0);

        TaskAdditionalField::query()
            ->where('task_id', $task->id)
            ->whereNotIn('id', $incomingIds)
            ->delete();

        foreach ($fields as $index => $field) {
            $data = [
                'task_id' => $task->id,
                'label' => $field['label'],
                'field_name' => $this->fieldNameFor($field['label'], $task->id, isset($field['id']) ? (int) $field['id'] : null),
                'input_type' => $field['input_type'],
                'show_when' => $field['show_when'],
                'is_required' => $field['is_required'],
                'sort_order' => $index,
                'options' => $this->optionsFor($field),
            ];

            if (! empty($field['id']) && (int) $field['id'] > 0) {
                TaskAdditionalField::query()
                    ->where('id', (int) $field['id'])
                    ->where('task_id', $task->id)
                    ->update($data);
            } else {
                TaskAdditionalField::query()->create($data);
            }
        }
    }

    private function fieldNameFor(string $label, int $taskId, ?int $ignoreFieldId = null): string
    {
        $baseName = Str::slug($label, '_') ?: Str::random(8);
        $fieldName = $baseName;
        $suffix = 2;

        while (TaskAdditionalField::query()
            ->where('task_id', $taskId)
            ->where('field_name', $fieldName)
            ->when($ignoreFieldId !== null, fn ($query) => $query->whereKeyNot($ignoreFieldId))
            ->exists()
        ) {
            $fieldName = $baseName.'_'.$suffix;
            $suffix++;
        }

        return $fieldName;
    }

    /**
     * @param  array<string, mixed>  $field
     * @return array<int, string>|null
     */
    private function optionsFor(array $field): ?array
    {
        if (! in_array($field['input_type'], ['select', 'radio', 'checkbox'], true)) {
            return null;
        }

        $options = array_values(array_filter(
            $field['options'] ?? [],
            fn ($option): bool => trim((string) $option) !== ''
        ));

        return count($options) > 0 ? $options : null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function taskCategoryOptions(): array
    {
        return TaskCategory::query()
            ->ordered()
            ->get(['id', 'name', 'slug'])
            ->map(fn (TaskCategory $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function roleOptions(): array
    {
        return Role::query()
            ->ordered()
            ->get(['id', 'name', 'slug', 'level'])
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'level' => $role->level->value,
                'level_label' => $role->level->label(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function transformTask(Task $task): array
    {
        return [
            'id' => $task->id,
            'uuid' => $task->uuid,
            'task_category_id' => $task->task_category_id,
            'role_id' => $task->role_id,
            'name' => $task->name,
            'description' => $task->description,
            'time_require' => $task->time_require,
            'is_active' => $task->is_active,
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
                    'uuid' => $field->uuid,
                    'label' => $field->label,
                    'field_name' => $field->field_name,
                    'input_type' => $field->input_type->value,
                    'input_type_label' => $field->input_type->label(),
                    'show_when' => $field->show_when->value,
                    'show_when_label' => $field->show_when->label(),
                    'is_required' => $field->is_required,
                    'sort_order' => $field->sort_order,
                    'options' => $field->options ?? [],
                ])
                ->values()
                ->all(),
            'created_at' => $task->created_at?->toIso8601String(),
            'updated_at' => $task->updated_at?->toIso8601String(),
        ];
    }
}
