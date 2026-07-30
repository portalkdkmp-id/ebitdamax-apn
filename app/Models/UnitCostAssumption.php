<?php

namespace App\Models;

use App\Policies\UnitCostAssumptionPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[UsePolicy(UnitCostAssumptionPolicy::class)]
class UnitCostAssumption extends Model
{
    public const CODE_KDKMP_GERAI = 'kdkmp-gerai';

    protected $fillable = [
        'user_id',
        'code',
        'name',
        'assumption_date',
        'days_per_year',
        'days_per_month',
        'work_hours_per_day',
        'source_sheet',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rows(): HasMany
    {
        return $this->hasMany(UnitCostAssumptionRow::class)
            ->orderBy('sort_order');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'assumption_date' => 'date',
            'days_per_year' => 'integer',
            'days_per_month' => 'integer',
            'work_hours_per_day' => 'decimal:2',
        ];
    }
}
