<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingMinuteItemStatusHistory extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'meeting_minute_item_id',
        'from_status',
        'to_status',
        'note',
        'changed_by',
        'changed_by_name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function meetingMinuteItem(): BelongsTo
    {
        return $this->belongsTo(MeetingMinuteItem::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
