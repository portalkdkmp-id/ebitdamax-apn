<?php

namespace App\Models;

use App\Enums\TaskPeriod;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'uuid',
        'task_category_id',
        'name',
        'description',
        'time_require',
        'lower_time_threshold_minutes',
        'upper_time_threshold_minutes',
        'period',
        'is_active',
    ];

    protected $casts = [
        'time_require' => 'integer',
        'lower_time_threshold_minutes' => 'integer',
        'upper_time_threshold_minutes' => 'integer',
        'period' => TaskPeriod::class,
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Task $task): void {
            if (! $task->uuid) {
                $task->uuid = (string) Str::uuid();
            }
        });
    }

    public function taskCategory(): BelongsTo
    {
        return $this->belongsTo(TaskCategory::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'task_roles')
            ->withTimestamps();
    }

    public function additionalFields(): HasMany
    {
        return $this->hasMany(TaskAdditionalField::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(TaskReport::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
