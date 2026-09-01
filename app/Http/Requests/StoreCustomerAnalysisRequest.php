<?php

namespace App\Http\Requests;

use App\Models\CustomerAnalysis;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerAnalysisRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', CustomerAnalysis::class) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'occupation_role' => [
                'required',
                'string',
                Rule::in(array_keys(CustomerAnalysis::occupationLabels())),
            ],
            'occupation_other' => [
                'nullable',
                'string',
                'max:255',
                'required_if:occupation_role,'.CustomerAnalysis::OCCUPATION_OTHER,
            ],
            'age' => ['required', 'integer', 'between:1,120'],
            'gender' => [
                'required',
                'string',
                Rule::in(array_keys(CustomerAnalysis::genderLabels())),
            ],
            'interview_purpose' => ['required', 'string', 'max:1000'],
            'summary' => ['required', 'string', 'max:5000'],
            'sentiment' => ['required', 'integer', 'between:1,5'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'occupation_other.required_if' => 'Pekerjaan atau peran lainnya wajib diisi.',
            'age.between' => 'Umur harus berada antara 1 hingga 120 tahun.',
            'sentiment.between' => 'Nilai sentimen harus berada antara 1 hingga 5.',
        ];
    }
}
