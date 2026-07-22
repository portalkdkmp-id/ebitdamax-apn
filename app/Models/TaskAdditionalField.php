<?php

namespace App\Models;

use App\Enums\TaskAdditionalFieldInputType;
use App\Enums\TaskAdditionalFieldShowWhen;
use Database\Factories\TaskAdditionalFieldFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TaskAdditionalField extends Model
{
    /** @use HasFactory<TaskAdditionalFieldFactory> */
    use HasFactory;

    protected $fillable = [
        'uuid',
        'task_id',
        'label',
        'field_name',
        'input_type',
        'show_when',
        'is_required',
        'sort_order',
        'options',
    ];

    protected $casts = [
        'input_type' => TaskAdditionalFieldInputType::class,
        'show_when' => TaskAdditionalFieldShowWhen::class,
        'is_required' => 'boolean',
        'sort_order' => 'integer',
        'options' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (TaskAdditionalField $field): void {
            if (! $field->uuid) {
                $field->uuid = (string) Str::uuid();
            }
        });
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
