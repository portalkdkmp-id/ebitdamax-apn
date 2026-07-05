<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EbitdaValue extends Model
{
    public const SCENARIO_TARGET_TAHUNAN = 'target_tahunan';

    public const SCENARIO_TARGET_HARIAN = 'target_harian';

    public const SCENARIO_PLAN_HARIAN = 'plan_harian';

    public const SCENARIO_AKTUAL_HARIAN = 'aktual_harian';

    protected $fillable = [
        'excel_import_id',
        'organization_id',
        'period_date',
        'year',
        'scenario',
        'source_sheet',
        'revenue',
        'doc_variable',
        'doc_fixed',
        'ioc',
        'toc',
        'ebitda',
        'ebitda_margin',
        'raw_payload',
        'classification',
        'man_cost',
        'method_cost',
        'material_cost',
        'machine_cost',
    ];

    protected $casts = [
        'period_date' => 'date',
        'revenue' => 'decimal:2',
        'doc_variable' => 'decimal:2',
        'doc_fixed' => 'decimal:2',
        'ioc' => 'decimal:2',
        'toc' => 'decimal:2',
        'ebitda' => 'decimal:2',
        'ebitda_margin' => 'decimal:4',
        'raw_payload' => 'array',
        'man_cost' => 'decimal:2',
        'method_cost' => 'decimal:2',
        'material_cost' => 'decimal:2',
        'machine_cost' => 'decimal:2',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function excelImport(): BelongsTo
    {
        return $this->belongsTo(ExcelImport::class);
    }

    public static function calculateToc(float $docVariable, float $docFixed, float $ioc): float
    {
        return $docVariable + $docFixed + $ioc;
    }

    public static function calculateEbitda(float $revenue, float $toc): float
    {
        return $revenue - $toc;
    }

    public static function calculateMargin(float $revenue, float $ebitda): ?float
    {
        if ($revenue == 0.0) {
            return null;
        }

        return round(($ebitda / $revenue) * 100, 4);
    }
}
