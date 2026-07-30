<?php

namespace App\Http\Requests;

use App\Models\PlanEbitdaMatrix;
use App\Models\PlanEbitdaMatrixRow;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePlanEbitdaMatrixRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $planEbitdaMatrix = $this->route('planEbitdaMatrix');

        return $planEbitdaMatrix instanceof PlanEbitdaMatrix
            ? $this->user()?->can('update', $planEbitdaMatrix) === true
            : $this->user()?->can('create', PlanEbitdaMatrix::class) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'processes' => ['required', 'array', 'size:17'],
            'processes.*.sequence' => ['required', 'integer', 'between:1,17', 'distinct'],
            'processes.*.process_group' => ['required', 'string', 'max:255'],
            'processes.*.detail_process' => ['required', 'string', 'max:5000'],
            'processes.*.unit_name' => ['nullable', 'string', 'max:255'],
            'processes.*.pic' => ['required', 'string', 'max:255'],
            'rows' => ['required', 'array', 'size:118'],
            'rows.*.section_code' => ['required', 'string', 'max:10'],
            'rows.*.sort_order' => ['required', 'integer', 'between:1,150', 'distinct'],
            'rows.*.row_type' => [
                'required',
                Rule::in([
                    PlanEbitdaMatrixRow::TYPE_DETAIL,
                    PlanEbitdaMatrixRow::TYPE_SUMMARY,
                    PlanEbitdaMatrixRow::TYPE_SINGLE,
                ]),
            ],
            'rows.*.label' => ['present', 'string', 'max:5000'],
            'rows.*.values' => ['required', 'array', 'size:17'],
            'rows.*.values.*' => ['nullable', 'string', 'max:255'],
            'rows.*.total' => ['nullable', 'string', 'max:255'],
            'rows.*.notes' => ['nullable', 'string', 'max:2000'],
            'rows.*.notes_tone' => ['nullable', Rule::in(['yellow', 'blue'])],
            'rows.*.is_calculated' => ['required', 'boolean'],
            'rows.*.source_page' => ['required', 'integer', 'between:1,4'],
        ];
    }
}
