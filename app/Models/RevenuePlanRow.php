<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RevenuePlanRow extends Model
{
    public const TYPE_ITEM = 'item';

    public const TYPE_BLANK = 'blank';

    protected $fillable = [
        'revenue_plan_id',
        'sort_order',
        'row_type',
        'display_number',
        'revenue_service',
        'planned_volume',
        'unit',
        'rate',
        'planned_revenue',
    ];

    /**
     * @return BelongsTo<RevenuePlan, $this>
     */
    public function revenuePlan(): BelongsTo
    {
        return $this->belongsTo(RevenuePlan::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'display_number' => 'integer',
            'planned_volume' => 'decimal:3',
            'rate' => 'decimal:2',
            'planned_revenue' => 'decimal:2',
        ];
    }
}
