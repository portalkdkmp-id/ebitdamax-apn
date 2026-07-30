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
            'plan_revenue' => ['nullable', 'string', 'regex:/^\d+(?:\.\d{1,2})?$/', 'max:255'],
            'actual_revenue' => ['nullable', 'string', 'regex:/^\d+(?:\.\d{1,2})?$/', 'max:255'],
            'plan_cost' => ['nullable', 'string', 'max:255'],
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
            'plan_revenue' => 'plan revenue',
            'actual_revenue' => 'actual revenue',
            'plan_cost' => 'plan cost',
            'performance_scoring' => 'performance scoring',
        ];
    }
}
