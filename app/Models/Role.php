<?php

namespace App\Models;

use App\Enums\RoleLevel;
use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Role extends Model
{
    /** @use HasFactory<RoleFactory> */
    use HasFactory;

    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'level',
    ];

    protected $casts = [
        'level' => RoleLevel::class,
    ];

    protected static function booted(): void
    {
        static::creating(function (Role $role): void {
            if (! $role->uuid) {
                $role->uuid = (string) Str::uuid();
            }
        });
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany('App\Models\Task');
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('name');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
