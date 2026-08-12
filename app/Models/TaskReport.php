<?php

namespace App\Models;

use App\Enums\TaskReportStatus;
use App\Policies\TaskReportPolicy;
use Database\Factories\TaskReportFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[UsePolicy(TaskReportPolicy::class)]
class TaskReport extends Model
{
    /** @use HasFactory<TaskReportFactory> */
    use HasFactory;

    protected $fillable = [
        'uuid',
        'task_id',
        'user_id',
        'period_key',
        'started_photo',
        'started_documents',
        'finished_photo',
        'finished_documents',
        'started_at',
        'finished_at',
        'duration_minutes',
        'member_allocations',
        'status',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'started_documents' => 'array',
        'finished_at' => 'datetime',
        'finished_documents' => 'array',
        'duration_minutes' => 'integer',
        'member_allocations' => 'array',
        'status' => TaskReportStatus::class,
    ];

    protected static function booted(): void
    {
        static::creating(function (TaskReport $report): void {
            if (! $report->uuid) {
                $report->uuid = (string) Str::uuid();
            }
        });
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(TaskReportValue::class);
    }
}
