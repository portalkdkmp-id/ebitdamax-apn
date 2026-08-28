<?php

namespace App\Models;

use App\Enums\TaskBmcStatus;
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

    private const EMPTY_COST_BREAKDOWN = '{"man":0,"machine":0,"method":0,"material":0}';

    private const FIXED_COST_CONFIGURED_KEY = '_configured';

    protected $fillable = [
        'uuid',
        'task_category_id',
        'bmc_status',
        'sort_order',
        'name',
        'description',
        'execution_time',
        'time_require',
        'lower_time_threshold_minutes',
        'upper_time_threshold_minutes',
        'period',
        'is_active',
        'is_mandatory',
        'fixed_cost',
        'variable_cost',
    ];

    protected $attributes = [
        'bmc_status' => TaskBmcStatus::Unmapped->value,
        'is_mandatory' => false,
        'fixed_cost' => self::EMPTY_COST_BREAKDOWN,
        'variable_cost' => self::EMPTY_COST_BREAKDOWN,
    ];

    protected $casts = [
        'bmc_status' => TaskBmcStatus::class,
        'sort_order' => 'integer',
        'time_require' => 'integer',
        'lower_time_threshold_minutes' => 'integer',
        'upper_time_threshold_minutes' => 'integer',
        'period' => TaskPeriod::class,
        'is_active' => 'boolean',
        'is_mandatory' => 'boolean',
        'fixed_cost' => 'array',
        'variable_cost' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (Task $task): void {
            if (! $task->uuid) {
                $task->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * @return array{man: int, machine: int, method: int, material: int}
     */
    public function fixedCostBreakdown(): array
    {
        return self::normalizeCostBreakdown($this->fixed_cost);
    }

    /**
     * @return array{man: int, machine: int, method: int, material: int}
     */
    public function variableCostBreakdown(): array
    {
        return self::normalizeCostBreakdown($this->variable_cost);
    }

    public function fixedCostTotal(): int
    {
        return self::costTotal($this->fixed_cost);
    }

    public function hasConfiguredFixedCost(): bool
    {
        $fixedCost = is_array($this->fixed_cost) ? $this->fixed_cost : [];

        return ($fixedCost[self::FIXED_COST_CONFIGURED_KEY] ?? null) === true;
    }

    public function variableCostTotal(): int
    {
        return self::costTotal($this->variable_cost);
    }

    /**
     * @return array{man: int, machine: int, method: int, material: int}
     */
    public static function normalizeCostBreakdown(mixed $cost): array
    {
        $cost = is_array($cost) ? $cost : [];

        return [
            'man' => self::normalizeCostValue($cost['man'] ?? 0),
            'machine' => self::normalizeCostValue($cost['machine'] ?? 0),
            'method' => self::normalizeCostValue($cost['method'] ?? 0),
            'material' => self::normalizeCostValue($cost['material'] ?? 0),
        ];
    }

    /**
     * @return array{man: int, machine: int, method: int, material: int, _configured: bool}
     */
    public static function configuredFixedCostBreakdown(mixed $cost): array
    {
        return [
            ...self::normalizeCostBreakdown($cost),
            self::FIXED_COST_CONFIGURED_KEY => true,
        ];
    }

    public static function costTotal(mixed $cost): int
    {
        return array_sum(self::normalizeCostBreakdown($cost));
    }

    private static function normalizeCostValue(mixed $value): int
    {
        if (! is_numeric($value)) {
            return 0;
        }

        return max(0, (int) $value);
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

    /**
     * @param  iterable<int, int>  $selectedTaskIds
     */
    public function scopeForKdkmpExecution(Builder $query, iterable $selectedTaskIds): Builder
    {
        $taskIds = collect($selectedTaskIds)
            ->map(fn (mixed $taskId): int => (int) $taskId)
            ->filter(fn (int $taskId): bool => $taskId > 0)
            ->unique()
            ->values();

        return $query->where(function (Builder $executionQuery) use ($taskIds): void {
            $executionQuery->where('is_mandatory', true);

            if ($taskIds->isNotEmpty()) {
                $executionQuery->orWhereIn('id', $taskIds);
            }
        });
    }
}
