<?php

namespace App\Actions;

use App\Models\EbitdamaxKdkmp;
use App\Models\User;
use App\Services\KdkmpActualVariableCostService;
use App\Services\KdkmpDashboardMetricsService;
use Carbon\CarbonImmutable;

final class SyncKdkmpActualRevenueAction
{
    public function __construct(
        private readonly KdkmpActualVariableCostService $actualVariableCost,
        private readonly KdkmpDashboardMetricsService $dashboardMetrics,
    ) {}

    public function handle(User $user, CarbonImmutable $businessDate): void
    {
        if (! $user->isKdkmpManager() || $user->sdm_kdkmp_entry_id === null) {
            return;
        }

        $metrics = $this->dashboardMetrics->forUser($user->id, $businessDate);
        $entry = EbitdamaxKdkmp::query()->firstOrNew([
            'sdm_kdkmp_entry_id' => $user->sdm_kdkmp_entry_id,
            'report_date' => $businessDate->toDateString(),
        ]);

        if (! $entry->exists) {
            $entry->created_by = $user->id;
            $entry->target_revenue = EbitdamaxKdkmp::TARGET_REVENUE;
        }

        $actualRevenue = $metrics['actual_revenue'];

        $entry->fill([
            'actual_revenue' => $actualRevenue,
            'actual_cost' => $metrics['actual_cost'],
            'actual_variable_cost' => $this->actualVariableCost->forUser($user->id, $businessDate),
            'actual_ebitda_margin' => EbitdamaxKdkmp::calculateActualEbitdaMargin($actualRevenue),
            'performance_scoring' => EbitdamaxKdkmp::calculatePerformanceScoring(
                $entry->plan_revenue,
                $actualRevenue,
                $metrics['task_completion_rate'],
                $metrics['time_compliance_rate'],
            ),
            'total_duration' => $metrics['total_duration'],
            'plan_revenue_requires_review' => EbitdamaxKdkmp::planRevenueRequiresReview($entry->plan_revenue),
            'updated_by' => $user->id,
        ]);
        $entry->save();
    }
}
