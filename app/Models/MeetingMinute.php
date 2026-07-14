<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MeetingMinute extends Model
{
    protected $fillable = [
        'title',
        'meeting_date',
        'start_time',
        'end_time',
        'location',
        'attendees',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'meeting_date' => 'date',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(MeetingMinuteItem::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
