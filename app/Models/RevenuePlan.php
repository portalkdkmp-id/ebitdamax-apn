<?php

namespace App\Models;

use App\Policies\RevenuePlanPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[UsePolicy(RevenuePlanPolicy::class)]
class RevenuePlan extends Model
{
    public const CODE_KDKMP_GERAI = 'kdkmp-gerai';

    protected $fillable = [
        'user_id',
        'code',
        'name',
        'plan_date',
        'rka_revenue_target',
        'planned_production_quantity',
        'days_per_month',
        'daily_rka_revenue_target',
        'planned_total_daily_revenue',
        'source_sheet',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rows(): HasMany
    {
        return $this->hasMany(RevenuePlanRow::class)
            ->orderBy('sort_order');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'plan_date' => 'date',
            'rka_revenue_target' => 'decimal:2',
            'planned_production_quantity' => 'decimal:3',
            'days_per_month' => 'integer',
            'daily_rka_revenue_target' => 'decimal:2',
            'planned_total_daily_revenue' => 'decimal:2',
        ];
    }
}
