<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanEbitdaMatrixRow extends Model
{
    public const TYPE_DETAIL = 'detail';

    public const TYPE_SUMMARY = 'summary';

    public const TYPE_SINGLE = 'single';

    protected $fillable = [
        'plan_ebitda_matrix_id',
        'unit_cost_assumption_row_id',
        'section_code',
        'sort_order',
        'row_type',
        'label',
        'values',
        'total',
        'notes',
        'notes_tone',
        'is_calculated',
        'source_page',
    ];

    public function planEbitdaMatrix(): BelongsTo
    {
        return $this->belongsTo(PlanEbitdaMatrix::class);
    }

    public function unitCostAssumptionRow(): BelongsTo
    {
        return $this->belongsTo(UnitCostAssumptionRow::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'values' => 'array',
            'is_calculated' => 'boolean',
            'source_page' => 'integer',
        ];
    }
}
