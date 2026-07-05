<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Organization extends Model
{
    protected $fillable = [
        'parent_id',
        'code',
        'name',
        'slug',
        'depth',
        'path',
        'level',
        'node_type',
        'directorate_group',
        'is_revenue_center',
        'is_cost_center',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_revenue_center' => 'boolean',
        'is_cost_center' => 'boolean',
        'is_active' => 'boolean',
        'depth' => 'integer',
        'sort_order' => 'integer',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Organization::class, 'parent_id')
            ->orderBy('sort_order')
            ->orderBy('code');
    }

    public function childrenRecursive(): HasMany
    {
        return $this->children()->with('childrenRecursive');
    }

    public function ebitdaValues(): HasMany
    {
        return $this->hasMany(EbitdaValue::class);
    }

    public function scopeRoot(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('code');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function scopeDirectorates(Builder $query): Builder
    {
        return $query->where('level', 'Direktorat');
    }

    public function scopeDashboardUnits(Builder $query): Builder
    {
        return $query->where(function (Builder $query): void {
            $query->where('level', 'Direktorat')
                ->orWhere('level', 'Corporate Function')
                ->orWhere('node_type', 'support_center');
        });
    }

    public function getSubtreeIds(): array
    {
        if (! $this->path) {
            return [$this->id];
        }

        return self::query()
            ->where('id', $this->id)
            ->orWhere('path', 'like', $this->path.'/%')
            ->pluck('id')
            ->all();
    }

    public function profile(): HasOne
    {
        return $this->hasOne(OrganizationProfile::class);
    }

    public function calculation(): HasOne
    {
        return $this->hasOne(OrganizationCalculation::class);
    }
}
