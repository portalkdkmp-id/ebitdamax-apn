<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $organizationId = $this->route('organization')?->id;

        return [
            'parent_id' => ['nullable', 'exists:organizations,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('organizations', 'code')->ignore($organizationId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:100'],
            'node_type' => ['nullable', 'string', 'max:100'],
            'directorate_group' => ['nullable', 'string', 'max:255'],
            'is_revenue_center' => ['required', 'boolean'],
            'is_cost_center' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}