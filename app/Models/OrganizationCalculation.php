<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationCalculation extends Model
{
    protected $fillable = [
        'organization_id',
        'source_sheet',
        'classification',
        'man_cost',
        'method_cost',
        'material_cost',
        'machine_cost',
        'total_cost',
        'doc_variable',
        'doc_fixed',
        'ioc',
        'raw_payload',
    ];

    protected $casts = [
        'man_cost' => 'decimal:2',
        'method_cost' => 'decimal:2',
        'material_cost' => 'decimal:2',
        'machine_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'doc_variable' => 'decimal:2',
        'doc_fixed' => 'decimal:2',
        'ioc' => 'decimal:2',
        'raw_payload' => 'array',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
