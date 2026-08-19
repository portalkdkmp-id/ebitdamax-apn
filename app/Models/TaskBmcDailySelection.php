<?php

namespace App\Models;

use Database\Factories\TaskBmcDailySelectionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskBmcDailySelection extends Model
{
    /** @use HasFactory<TaskBmcDailySelectionFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bmc_point_id',
        'selection_date',
    ];

    protected function casts(): array
    {
        return [
            'selection_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bmcPoint(): BelongsTo
    {
        return $this->belongsTo(BmcPoint::class);
    }
}
