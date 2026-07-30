<?php

namespace App\Models;

use App\Policies\BusinessProcessPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[UsePolicy(BusinessProcessPolicy::class)]
class BusinessProcess extends Model
{
    public const CODE_KDKMP_GERAI = 'kdkmp-gerai';

    protected $fillable = [
        'user_id',
        'code',
        'name',
        'unit_name',
        'unit_code',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function steps(): HasMany
    {
        return $this->hasMany(BusinessProcessStep::class)
            ->orderBy('sequence');
    }
}
