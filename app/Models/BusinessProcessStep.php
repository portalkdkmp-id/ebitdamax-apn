<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessProcessStep extends Model
{
    protected $fillable = [
        'business_process_id',
        'sequence',
        'process_group',
        'detail_process',
        'pic',
        'standard_time_minutes',
        'output_target',
        'responsibility_value',
    ];

    /**
     * @return BelongsTo<BusinessProcess, $this>
     */
    public function businessProcess(): BelongsTo
    {
        return $this->belongsTo(BusinessProcess::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sequence' => 'integer',
            'standard_time_minutes' => 'integer',
            'responsibility_value' => 'integer',
        ];
    }
}
