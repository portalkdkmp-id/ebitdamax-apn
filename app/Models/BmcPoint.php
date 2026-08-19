<?php

namespace App\Models;

use Database\Factories\BmcPointFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class BmcPoint extends Model
{
    /** @use HasFactory<BmcPointFactory> */
    use HasFactory;

    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'description',
    ];

    protected static function booted(): void
    {
        static::creating(function (BmcPoint $bmcPoint): void {
            if (! $bmcPoint->uuid) {
                $bmcPoint->uuid = (string) Str::uuid();
            }
        });
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function dailySelections(): HasMany
    {
        return $this->hasMany(TaskBmcDailySelection::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
