<?php

namespace App\Http\Requests;

use App\Enums\TaskAdditionalFieldInputType;
use App\Enums\TaskAdditionalFieldShowWhen;
use App\Enums\TaskBmcStatus;
use App\Enums\TaskPeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $taskId = $this->route('task')?->id;

        return [
            'task_category_id' => ['required', 'exists:task_categories,id'],
            'bmc_status' => [
                'required',
                Rule::enum(TaskBmcStatus::class),
            ],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['required', 'integer', 'distinct', 'exists:roles,id'],
            'sort_order' => [
                'nullable',
                'integer',
                'min:1',
                Rule::unique('tasks', 'sort_order')->ignore($taskId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'execution_time' => ['nullable', 'date_format:H:i'],
            'time_require' => ['required', 'integer', 'min:1'],
            'lower_time_threshold_minutes' => [
                'nullable',
                'required_with:upper_time_threshold_minutes',
                'integer',
                'min:0',
                'lte:upper_time_threshold_minutes',
            ],
            'upper_time_threshold_minutes' => [
                'nullable',
                'required_with:lower_time_threshold_minutes',
                'integer',
                'min:0',
                'gte:lower_time_threshold_minutes',
            ],
            'period' => ['required', Rule::enum(TaskPeriod::class)],
            'is_active' => ['required', 'boolean'],
            'is_mandatory' => ['required', 'boolean'],
            'fixed_cost' => ['required', 'array'],
            'fixed_cost.man' => ['required', 'integer', 'min:0'],
            'fixed_cost.machine' => ['required', 'integer', 'min:0'],
            'fixed_cost.method' => ['required', 'integer', 'min:0'],
            'fixed_cost.material' => ['required', 'integer', 'min:0'],
            'variable_cost' => ['required', 'array'],
            'variable_cost.man' => ['required', 'integer', 'min:0'],
            'variable_cost.machine' => ['required', 'integer', 'min:0'],
            'variable_cost.method' => ['required', 'integer', 'min:0'],
            'variable_cost.material' => ['required', 'integer', 'min:0'],
            'additional_fields' => ['nullable', 'array'],
            'additional_fields.*.id' => ['nullable', 'integer', 'exists:task_additional_fields,id'],
            'additional_fields.*.label' => ['required', 'string', 'max:255'],
            'additional_fields.*.input_type' => ['required', Rule::enum(TaskAdditionalFieldInputType::class)],
            'additional_fields.*.show_when' => ['required', Rule::enum(TaskAdditionalFieldShowWhen::class)],
            'additional_fields.*.is_required' => ['required', 'boolean'],
            'additional_fields.*.options' => ['nullable', 'array'],
            'additional_fields.*.options.*' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'bmc_status' => 'poin BMC',
            'sort_order' => 'nomor urut',
            'execution_time' => 'jam pelaksanaan',
            'lower_time_threshold_minutes' => 'ambang waktu bawah',
            'upper_time_threshold_minutes' => 'ambang waktu atas',
            'is_mandatory' => 'status task wajib',
            'fixed_cost.man' => 'fixed cost man',
            'fixed_cost.machine' => 'fixed cost machine',
            'fixed_cost.method' => 'fixed cost method',
            'fixed_cost.material' => 'fixed cost material',
            'variable_cost.man' => 'variable cost man',
            'variable_cost.machine' => 'variable cost machine',
            'variable_cost.method' => 'variable cost method',
            'variable_cost.material' => 'variable cost material',
        ];
    }
}
