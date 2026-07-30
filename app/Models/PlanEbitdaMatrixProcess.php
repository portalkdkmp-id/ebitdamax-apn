<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanEbitdaMatrixProcess extends Model
{
    protected $fillable = [
        'plan_ebitda_matrix_id',
        'business_process_step_id',
        'sequence',
        'process_group',
        'detail_process',
        'unit_name',
        'pic',
    ];

    public function planEbitdaMatrix(): BelongsTo
    {
        return $this->belongsTo(PlanEbitdaMatrix::class);
    }

    public function businessProcessStep(): BelongsTo
    {
        return $this->belongsTo(BusinessProcessStep::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['sequence' => 'integer'];
    }
}
