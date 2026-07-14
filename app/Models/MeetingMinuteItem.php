<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingMinuteItem extends Model
{
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
}
