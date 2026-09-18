<?php

namespace App\Http\Requests;

use App\Models\EbitdamaxKdkmp;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ViewKdkmpPosRevenueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewDashboard', EbitdamaxKdkmp::class) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
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
            'start_date' => 'tanggal awal',
            'end_date' => 'tanggal akhir',
        ];
    }
}
