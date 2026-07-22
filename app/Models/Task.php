<?php

namespace App\Models;

use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'uuid',
        'task_category_id',
        'role_id',
        'name',
        'description',
        'time_require',
        'is_active',
    ];

    protected $casts = [
        'time_require' => 'integer',
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

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function additionalFields(): HasMany
    {
        return $this->hasMany(TaskAdditionalField::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany('App\Models\TaskReport');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
