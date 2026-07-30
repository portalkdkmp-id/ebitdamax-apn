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
            'target_revenue' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:999999999999999999.99'],
            'actual_revenue' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:999999999999999999.99'],
            'cost' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:999999999999999999.99'],
            'duration_hours' => ['nullable', 'integer', 'min:0', 'max:71582788'],
            'duration_minutes' => ['nullable', 'integer', 'between:0,59'],
            'performance_score' => ['nullable', 'numeric', 'decimal:0,2', 'between:0,100'],
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
            'actual_revenue' => 'actual revenue',
            'cost' => 'cost',
            'duration_hours' => 'durasi jam',
            'duration_minutes' => 'durasi menit',
            'performance_score' => 'performance score',
        ];
    }
}
