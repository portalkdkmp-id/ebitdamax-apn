<?php

namespace App\Http\Requests;

use App\Models\EbitdamaxKdkmp;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveEbitdamaxKdkmpRequest extends FormRequest
{
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
            'target_revenue' => ['nullable', 'string', 'max:255'],
            'plan_revenue' => ['nullable', 'string', 'max:255'],
            'actual_revenue' => ['nullable', 'string', 'max:255'],
            'target_cost' => ['nullable', 'string', 'max:255'],
            'plan_cost' => ['nullable', 'string', 'max:255'],
            'actual_cost' => ['nullable', 'string', 'max:255'],
            'target_ebitda' => ['nullable', 'string', 'max:255'],
            'plan_ebitda' => ['nullable', 'string', 'max:255'],
            'actual_ebitda' => ['nullable', 'string', 'max:255'],
            'target_ebitda_margin' => ['nullable', 'string', 'max:255'],
            'actual_ebitda_margin' => ['nullable', 'string', 'max:255'],
            'total_duration' => ['nullable', 'string', 'max:255'],
            'performance_scoring' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'target_revenue' => 'target revenue',
            'plan_revenue' => 'plan revenue',
            'actual_revenue' => 'actual revenue',
            'target_cost' => 'target cost',
            'plan_cost' => 'plan cost',
            'actual_cost' => 'actual cost',
            'target_ebitda' => 'target EBITDA',
            'plan_ebitda' => 'plan EBITDA',
            'actual_ebitda' => 'actual EBITDA',
            'target_ebitda_margin' => 'target EBITDA margin',
            'actual_ebitda_margin' => 'actual EBITDA margin',
            'total_duration' => 'total duration',
            'performance_scoring' => 'performance scoring',
        ];
    }
}
