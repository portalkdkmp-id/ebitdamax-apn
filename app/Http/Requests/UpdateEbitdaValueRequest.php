<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEbitdaValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organization_id' => ['required', 'exists:organizations,id'],
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'period_date' => ['nullable', 'date'],
            'scenario' => ['required', 'in:target_tahunan,target_harian,plan_harian,aktual_harian'],

            'revenue' => ['required', 'numeric', 'min:0'],
            'doc_variable' => ['required', 'numeric', 'min:0'],
            'doc_fixed' => ['required', 'numeric', 'min:0'],
            'ioc' => ['required', 'numeric', 'min:0'],

            'classification' => ['nullable', 'string', 'max:255'],
            'man_cost' => ['nullable', 'numeric', 'min:0'],
            'method_cost' => ['nullable', 'numeric', 'min:0'],
            'material_cost' => ['nullable', 'numeric', 'min:0'],
            'machine_cost' => ['nullable', 'numeric', 'min:0'],
            'source_sheet' => ['nullable', 'string', 'max:255'],
        ];
    }
}