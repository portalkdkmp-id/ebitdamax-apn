<?php

namespace App\Services;

use App\Enums\TaskReportStatus;
use App\Enums\TaskType;
use App\Models\Task;
use App\Models\TaskBmcDailySelection;
use App\Models\TaskReport;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class KdkmpFinancialMatrixService
{
    private const DAILY_COST_BUDGET = 9_172_133;

    /**
     * @return array{daily_cost_budget: float, total_estimated_minutes: int, total_actual_duration_minutes: int, total_plan_cost: float|null, total_actual_cost: float|null, plan_revenue: float|null, actual_revenue: float|null, plan_ebitda: float|null, actual_ebitda: float|null, points: array<int, array{process: int, task_id: int, task_name: string, estimated_minutes: int, actual_duration_minutes: int, plan_cost: float|null, actual_cost: float|null, cumulative_plan_cost: float|null, cumulative_actual_cost: float|null}>}
     */
    public function forUser(
        User $user,
        CarbonImmutable $businessDate,
        mixed $planRevenue,
        mixed $actualRevenue,
    ): array {
        $tasks = $this->tasksForUser($user, $businessDate);
        $totalEstimatedMinutes = (int) $tasks->sum('time_require');
        $durationsByTaskId = $this->completedDurationsByTask(
            user: $user,
            businessDate: $businessDate,
            taskIds: $tasks->pluck('id'),
        );
        $totalActualDurationMinutes = (int) $durationsByTaskId->sum();
        $hasCostAllocation = $totalEstimatedMinutes > 0;
        $cumulativePlanCost = 0.0;
        $cumulativeActualCost = 0.0;
        $lastTaskIndex = $tasks->count() - 1;

        $points = $tasks
            ->values()
            ->map(function (Task $task, int $index) use (
                $durationsByTaskId,
                $hasCostAllocation,
                $lastTaskIndex,
                $totalEstimatedMinutes,
                &$cumulativeActualCost,
                &$cumulativePlanCost,
            ): array {
                $estimatedMinutes = (int) $task->time_require;
                $actualDurationMinutes = (int) $durationsByTaskId->get($task->id, 0);

                if (! $hasCostAllocation) {
                    return [
                        'process' => $index + 1,
                        'task_id' => $task->id,
                        'task_name' => $task->name,
                        'estimated_minutes' => $estimatedMinutes,
                        'actual_duration_minutes' => $actualDurationMinutes,
                        'plan_cost' => null,
                        'actual_cost' => null,
                        'cumulative_plan_cost' => null,
                        'cumulative_actual_cost' => null,
                    ];
                }

                $planCost = $index === $lastTaskIndex
                    ? self::DAILY_COST_BUDGET - $cumulativePlanCost
                    : ($estimatedMinutes / $totalEstimatedMinutes) * self::DAILY_COST_BUDGET;
                $actualCost = ($actualDurationMinutes / $totalEstimatedMinutes) * self::DAILY_COST_BUDGET;
                $cumulativePlanCost += $planCost;
                $cumulativeActualCost += $actualCost;

                return [
                    'process' => $index + 1,
                    'task_id' => $task->id,
                    'task_name' => $task->name,
                    'estimated_minutes' => $estimatedMinutes,
                    'actual_duration_minutes' => $actualDurationMinutes,
                    'plan_cost' => round($planCost, 2),
                    'actual_cost' => round($actualCost, 2),
                    'cumulative_plan_cost' => round($cumulativePlanCost, 2),
                    'cumulative_actual_cost' => round($cumulativeActualCost, 2),
                ];
            })
            ->all();

        $totalPlanCost = $hasCostAllocation ? (float) self::DAILY_COST_BUDGET : null;
        $totalActualCost = $hasCostAllocation ? round($cumulativeActualCost, 2) : null;
        $normalizedPlanRevenue = $this->numericValue($planRevenue);
        $normalizedActualRevenue = $this->numericValue($actualRevenue);

        return [
            'daily_cost_budget' => (float) self::DAILY_COST_BUDGET,
            'total_estimated_minutes' => $totalEstimatedMinutes,
            'total_actual_duration_minutes' => $totalActualDurationMinutes,
            'total_plan_cost' => $totalPlanCost,
            'total_actual_cost' => $totalActualCost,
            'plan_revenue' => $normalizedPlanRevenue,
            'actual_revenue' => $normalizedActualRevenue,
            'plan_ebitda' => $normalizedPlanRevenue !== null && $totalPlanCost !== null
                ? round($normalizedPlanRevenue - $totalPlanCost, 2)
                : null,
            'actual_ebitda' => $normalizedActualRevenue !== null && $totalActualCost !== null
                ? round($normalizedActualRevenue - $totalActualCost, 2)
                : null,
            'points' => $points,
        ];
    }

    /**
     * @return Collection<int, Task>
     */
    private function tasksForUser(User $user, CarbonImmutable $businessDate): Collection
    {
        if ($user->role_id === null) {
            return collect();
        }

        $selectedBmcPointId = TaskBmcDailySelection::query()
            ->where('user_id', $user->id)
            ->whereDate('selection_date', $businessDate->toDateString())
            ->value('bmc_point_id');

        return Task::query()
            ->active()
            ->whereHas('roles', function (Builder $query) use ($user): void {
                $query->whereKey($user->role_id);
            })
            ->where(function (Builder $query) use ($selectedBmcPointId): void {
                $query->where('task_type', TaskType::Regular->value);

                if ($selectedBmcPointId !== null) {
                    $query->orWhere(function (Builder $bmcTaskQuery) use ($selectedBmcPointId): void {
                        $bmcTaskQuery
                            ->where('task_type', TaskType::KegiatanStrategisPilihan->value)
                            ->where('bmc_point_id', $selectedBmcPointId);
                    });
                }
            })
            ->orderByRaw('CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'name', 'time_require']);
    }

    /**
     * @param  Collection<int, int>  $taskIds
     * @return Collection<int, int>
     */
    private function completedDurationsByTask(
        User $user,
        CarbonImmutable $businessDate,
        Collection $taskIds,
    ): Collection {
        if ($taskIds->isEmpty()) {
            return collect();
        }

        return TaskReport::query()
            ->where('user_id', $user->id)
            ->whereIn('task_id', $taskIds)
            ->where('status', TaskReportStatus::Completed->value)
            ->whereBetween('finished_at', [
                $businessDate->startOfDay()->utc(),
                $businessDate->endOfDay()->utc(),
            ])
            ->get(['task_id', 'duration_minutes'])
            ->groupBy('task_id')
            ->map(
                fn (Collection $reports): int => (int) $reports->sum(
                    fn (TaskReport $report): int => $report->duration_minutes ?? 0
                )
            );
    }

    private function numericValue(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (! is_string($value) || trim($value) === '' || ! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }
}
