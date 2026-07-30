<?php

namespace App\Http\Requests;

use App\Models\UnitCostAssumption;
use App\Models\UnitCostAssumptionRow;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveUnitCostAssumptionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $assumption = $this->route('unitCostAssumption');

        return $assumption instanceof UnitCostAssumption
            ? $this->user()?->can('update', $assumption) === true
            : $this->user()?->can('create', UnitCostAssumption::class) === true;
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
            'assumption_date' => ['required', 'date'],
            'days_per_year' => ['required', 'integer', 'between:1,366'],
            'days_per_month' => ['required', 'integer', 'between:1,31'],
            'work_hours_per_day' => ['required', 'numeric', 'gt:0', 'lte:24'],
            'rows' => ['required', 'array', 'size:74'],
            'rows.*.sort_order' => ['required', 'integer', 'between:1,74', 'distinct'],
            'rows.*.source_page' => ['required', 'integer', 'between:1,4'],
            'rows.*.row_type' => [
                'required',
                Rule::in([
                    UnitCostAssumptionRow::TYPE_SUBTOTAL,
                    UnitCostAssumptionRow::TYPE_GROUP,
                    UnitCostAssumptionRow::TYPE_ITEM,
                    UnitCostAssumptionRow::TYPE_BLANK,
                    UnitCostAssumptionRow::TYPE_TOTAL,
                ]),
            ],
            'rows.*.section_code' => ['nullable', 'string', 'max:10'],
            'rows.*.category' => ['nullable', 'string', 'max:255'],
            'rows.*.cost_type' => ['nullable', 'string', 'max:255'],
            'rows.*.component' => ['nullable', 'string', 'max:5000'],
            'rows.*.plan_quantity' => ['nullable', 'numeric', 'min:0'],
            'rows.*.actual_quantity' => ['nullable', 'numeric', 'min:0'],
            'rows.*.description' => ['nullable', 'string', 'max:5000'],
            'rows.*.unit' => ['nullable', 'string', 'max:255'],
            'rows.*.base_price' => ['nullable', 'numeric', 'min:0'],
            'rows.*.plan_daily_cost' => ['nullable', 'numeric', 'min:0'],
            'rows.*.plan_hourly_cost' => ['nullable', 'numeric', 'min:0'],
            'rows.*.actual_daily_cost' => ['nullable', 'numeric', 'min:0'],
            'rows.*.actual_hourly_cost' => ['nullable', 'numeric', 'min:0'],
            'rows.*.plan_value' => ['nullable', 'numeric', 'min:0'],
            'rows.*.actual_value' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
