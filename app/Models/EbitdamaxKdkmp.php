<?php

namespace App\Models;

use App\Policies\EbitdamaxKdkmpPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[UsePolicy(EbitdamaxKdkmpPolicy::class)]
class EbitdamaxKdkmp extends Model
{
    public const TARGET_REVENUE = '20000000';

    public const ACTUAL_EBITDA_MARGIN_FIXED_COST = 17_477_716;

    public const TASK_COMPLETION_WEIGHT = 55;

    public const TIME_COMPLIANCE_WEIGHT = 30;

    public const REVENUE_WEIGHT = 15;

    public const ALL_FIELDS = [
        'target_revenue',
        'plan_revenue',
        'actual_revenue',
        'target_cost',
        'plan_cost',
        'actual_cost',
        'target_ebitda',
        'plan_ebitda',
        'actual_ebitda',
        'target_ebitda_margin',
        'actual_ebitda_margin',
        'total_duration',
        'performance_scoring',
    ];

    public const ACTIVE_FIELDS = [
        'target_revenue',
        'plan_revenue',
        'actual_revenue',
        'plan_cost',
        'actual_cost',
        'actual_ebitda_margin',
        'total_duration',
        'performance_scoring',
    ];

    public const EDITABLE_FIELDS = [
        'plan_revenue',
        'actual_revenue',
        'plan_cost',
    ];

    protected $table = 'ebitdamax_kdkmp';

    protected $fillable = [
        'sdm_kdkmp_entry_id',
        'report_date',
        'target_revenue',
        'plan_revenue',
        'plan_revenue_requires_review',
        'actual_revenue',
        'target_cost',
        'plan_cost',
        'actual_cost',
        'target_ebitda',
        'plan_ebitda',
        'actual_ebitda',
        'target_ebitda_margin',
        'actual_ebitda_margin',
        'total_duration',
        'performance_scoring',
        'created_by',
        'updated_by',
    ];

    public function sdmKdkmpEntry(): BelongsTo
    {
        return $this->belongsTo(SdmKdkmpEntry::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function isComplete(): bool
    {
        return $this->exists;
    }

    public static function planRevenueRequiresReview(?string $planRevenue): bool
    {
        if ($planRevenue === null || trim($planRevenue) === '' || ! is_numeric($planRevenue)) {
            return false;
        }

        return (float) $planRevenue < (float) self::TARGET_REVENUE;
    }

    public static function calculateActualEbitdaMargin(?string $actualRevenue): ?string
    {
        if ($actualRevenue === null || trim($actualRevenue) === '' || ! is_numeric($actualRevenue)) {
            return null;
        }

        $revenue = (float) $actualRevenue;

        if ($revenue === 0.0) {
            return null;
        }

        $margin = (($revenue - self::ACTUAL_EBITDA_MARGIN_FIXED_COST) / $revenue) * 100;
        $formattedMargin = rtrim(rtrim(number_format($margin, 2, '.', ''), '0'), '.');

        return $formattedMargin.'%';
    }

    public static function calculatePerformanceScoring(
        ?string $planRevenue,
        ?string $actualRevenue,
        float $taskCompletionRate,
        float $timeComplianceRate,
    ): string {
        $completionComponent = self::clampPercentage($taskCompletionRate)
            * self::TASK_COMPLETION_WEIGHT / 100;
        $timeComponent = self::clampPercentage($timeComplianceRate)
            * self::TIME_COMPLIANCE_WEIGHT / 100;
        $revenueRate = 0.0;

        if (
            $planRevenue !== null
            && $actualRevenue !== null
            && is_numeric($planRevenue)
            && is_numeric($actualRevenue)
            && (float) $planRevenue > 0
        ) {
            $revenueRate = self::clampPercentage(
                ((float) $actualRevenue / (float) $planRevenue) * 100
            );
        }

        $revenueComponent = $revenueRate * self::REVENUE_WEIGHT / 100;
        $score = min(100, max(0, $completionComponent + $timeComponent + $revenueComponent));
        $formattedScore = rtrim(rtrim(number_format($score, 2, '.', ''), '0'), '.');

        return $formattedScore.'%';
    }

    private static function clampPercentage(float $value): float
    {
        return min(100, max(0, $value));
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'plan_revenue_requires_review' => 'boolean',
        ];
    }
}
