<?php

namespace App\Http\Requests;

use App\Enums\TaskAdditionalFieldInputType;
use App\Enums\TaskAdditionalFieldShowWhen;
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
        return [
            'task_category_id' => ['required', 'exists:task_categories,id'],
            'role_id' => ['required', 'exists:roles,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'time_require' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
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
}
