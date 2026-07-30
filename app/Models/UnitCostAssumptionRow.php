<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnitCostAssumptionRow extends Model
{
    public const TYPE_SUBTOTAL = 'subtotal';

    public const TYPE_GROUP = 'group';

    public const TYPE_ITEM = 'item';

    public const TYPE_BLANK = 'blank';

    public const TYPE_TOTAL = 'total';

    protected $fillable = [
        'unit_cost_assumption_id',
        'sort_order',
        'source_page',
        'row_type',
        'section_code',
        'category',
        'cost_type',
        'component',
        'plan_quantity',
        'actual_quantity',
        'description',
        'unit',
        'base_price',
        'plan_daily_cost',
        'plan_hourly_cost',
        'actual_daily_cost',
        'actual_hourly_cost',
        'plan_value',
        'actual_value',
    ];

    /**
     * @return BelongsTo<UnitCostAssumption, $this>
     */
    public function assumption(): BelongsTo
    {
        return $this->belongsTo(UnitCostAssumption::class, 'unit_cost_assumption_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'source_page' => 'integer',
            'plan_quantity' => 'decimal:3',
            'actual_quantity' => 'decimal:3',
            'base_price' => 'decimal:2',
            'plan_daily_cost' => 'decimal:2',
            'plan_hourly_cost' => 'decimal:2',
            'actual_daily_cost' => 'decimal:2',
            'actual_hourly_cost' => 'decimal:2',
            'plan_value' => 'decimal:2',
            'actual_value' => 'decimal:2',
        ];
    }
}
