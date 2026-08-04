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
        $rules = [
            'actual_revenue' => ['nullable', 'string', 'regex:/^\d+(?:\.\d{1,2})?$/', 'max:255'],
            'plan_cost' => ['nullable', 'string', 'max:255'],
        ];

        foreach (array_keys(EbitdamaxKdkmp::PLAN_REVENUE_CATEGORIES) as $field) {
            $rules[$field] = ['required', 'string', 'regex:/^\d+(?:\.\d{1,2})?$/', 'max:255'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function planRevenueCategories(): array
    {
        return $this->safe()->only(array_keys(EbitdamaxKdkmp::PLAN_REVENUE_CATEGORIES));
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        $attributes = [
            'actual_revenue' => 'actual revenue',
            'plan_cost' => 'plan cost',
        ];

        foreach (EbitdamaxKdkmp::PLAN_REVENUE_CATEGORIES as $field => $label) {
            $attributes[$field] = "plan revenue {$label}";
        }

        return $attributes;
    }
}
