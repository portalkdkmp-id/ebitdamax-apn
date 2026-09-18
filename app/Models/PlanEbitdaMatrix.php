<?php

namespace App\Models;

use App\Policies\PlanEbitdaMatrixPolicy;
use Database\Factories\PlanEbitdaMatrixFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[UsePolicy(PlanEbitdaMatrixPolicy::class)]
class PlanEbitdaMatrix extends Model
{
    /** @use HasFactory<PlanEbitdaMatrixFactory> */
    use HasFactory;

    public const CODE_KDKMP_GERAI = 'kdkmp-gerai';

    protected $fillable = [
        'user_id',
        'code',
        'name',
        'source_sheet',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processes(): HasMany
    {
        return $this->hasMany(PlanEbitdaMatrixProcess::class)
            ->orderBy('sequence');
    }

    public function rows(): HasMany
    {
        return $this->hasMany(PlanEbitdaMatrixRow::class)
            ->orderBy('sort_order');
    }
}
