<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MeetingMinuteItem extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_OPEN,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'meeting_minute_id',
        'subject',
        'description',
        'action',
        'objectives',
        'date_start',
        'date_finish',
        'pic',
        'status',
        'remarks',
        'sort_order',
    ];

    protected $casts = [
        'date_start' => 'date',
        'date_finish' => 'date',
    ];

    public function meetingMinute(): BelongsTo
    {
        return $this->belongsTo(MeetingMinute::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(MeetingMinuteItemStatusHistory::class)
            ->latest('created_at')
            ->latest('id');
    }
}
