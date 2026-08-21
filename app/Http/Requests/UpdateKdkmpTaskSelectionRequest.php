<?php

namespace App\Http\Requests;

use App\Enums\TaskReportStatus;
use App\Models\EbitdamaxKdkmp;
use App\Models\Task;
use App\Models\TaskReport;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateKdkmpTaskSelectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('upsert', EbitdamaxKdkmp::class) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'selected_task_ids' => ['present', 'array'],
            'selected_task_ids.*' => ['integer', 'distinct'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $user = $this->user();

            if (! $user instanceof User || $user->role_id === null) {
                return;
            }

            $selectedTaskIds = collect($this->validated('selected_task_ids', []))
                ->map(fn (mixed $taskId): int => (int) $taskId)
                ->unique()
                ->values();
            $selectableTaskIds = Task::query()
                ->active()
                ->where('is_mandatory', false)
                ->whereHas('roles', fn ($query) => $query->whereKey($user->role_id))
                ->pluck('id')
                ->map(fn (mixed $taskId): int => (int) $taskId);
            $invalidTaskIds = $selectedTaskIds->diff($selectableTaskIds);

            if ($invalidTaskIds->isNotEmpty()) {
                $validator->errors()->add(
                    'selected_task_ids',
                    'Terdapat task pilihan yang tidak tersedia untuk role Anda.'
                );
            }

            $inProgressTaskIds = TaskReport::query()
                ->where('user_id', $user->id)
                ->where('status', TaskReportStatus::InProgress->value)
                ->whereHas('task', fn ($query) => $query->where('is_mandatory', false))
                ->pluck('task_id')
                ->map(fn (mixed $taskId): int => (int) $taskId)
                ->unique();

            if ($inProgressTaskIds->diff($selectedTaskIds)->isNotEmpty()) {
                $validator->errors()->add(
                    'selected_task_ids',
                    'Task yang sedang dikerjakan tidak dapat dilepas dari pilihan hari ini.'
                );
            }
        }];
    }
}
