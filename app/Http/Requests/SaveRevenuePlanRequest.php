<?php

namespace App\Http\Requests;

use App\Models\RevenuePlan;
use App\Models\RevenuePlanRow;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveRevenuePlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $revenuePlan = $this->route('revenuePlan');

        return $revenuePlan instanceof RevenuePlan
            ? $this->user()?->can('update', $revenuePlan) === true
            : $this->user()?->can('create', RevenuePlan::class) === true;
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
            'plan_date' => ['required', 'date'],
            'rka_revenue_target' => ['nullable', 'numeric', 'min:0'],
            'planned_production_quantity' => ['nullable', 'numeric', 'min:0'],
            'days_per_month' => ['required', 'integer', 'between:1,31'],
            'daily_rka_revenue_target' => ['nullable', 'numeric', 'min:0'],
            'planned_total_daily_revenue' => ['required', 'numeric', 'min:0'],
            'rows' => ['required', 'array', 'size:12'],
            'rows.*.sort_order' => ['required', 'integer', 'between:1,12', 'distinct'],
            'rows.*.row_type' => [
                'required',
                Rule::in([RevenuePlanRow::TYPE_ITEM, RevenuePlanRow::TYPE_BLANK]),
            ],
            'rows.*.display_number' => ['nullable', 'integer', 'between:1,6'],
            'rows.*.revenue_service' => ['nullable', 'string', 'max:1000'],
            'rows.*.planned_volume' => ['nullable', 'numeric', 'min:0'],
            'rows.*.unit' => ['nullable', 'string', 'max:255'],
            'rows.*.rate' => ['nullable', 'numeric', 'min:0'],
            'rows.*.planned_revenue' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
