<?php

namespace App\Services;

use App\Enums\TaskReportStatus;
use App\Models\Task;
use App\Models\TaskReport;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class KdkmpFinancialMatrixService
{
    public const DEFAULT_DAILY_FIXED_COST = 9_235_467;

    public function __construct(
        private readonly KdkmpTaskSelectionService $taskSelection,
    ) {}

    /**
     * @return array{fixed_cost: float, total_variable_cost: float, total_actual_variable_cost: float, total_estimated_minutes: int, total_actual_duration_minutes: int, total_plan_cost: float, total_actual_cost: float, plan_revenue: float|null, actual_revenue: float|null, plan_ebitda: float|null, actual_ebitda: float|null, points: array<int, array{process: int, task_id: int, task_name: string, estimated_minutes: int, actual_duration_minutes: int, plan_fixed_cost: float, plan_variable_cost: float, plan_cost: float, actual_fixed_cost: float, actual_variable_cost: float, actual_cost: float, cumulative_plan_cost: float, cumulative_actual_cost: float}>}
     */
    public function forUser(
        User $user,
        CarbonImmutable $businessDate,
        mixed $planRevenue,
        mixed $actualRevenue,
        mixed $actualVariableCostOverage,
    ): array {
        $tasks = $this->tasksForUser($user, $businessDate);
        $totalEstimatedMinutes = (int) $tasks->sum('time_require');
        $fixedCostData = $this->fixedCostDataFor($tasks);
        $totalFixedCost = $fixedCostData['total'];
        $totalPlanVariableCost = (float) $tasks->sum(
            fn (Task $task): int => $task->variableCostTotal()
        );
        $durationsByTaskId = $this->completedDurationsByTask(
            user: $user,
            businessDate: $businessDate,
            taskIds: $tasks->pluck('id'),
        );
        $totalActualDurationMinutes = (int) $durationsByTaskId->sum();
        $actualVariableCostOverage = $this->numericValue($actualVariableCostOverage) ?? 0.0;
        $totalActualVariableCost = $totalActualDurationMinutes > 0
            ? $totalPlanVariableCost + $actualVariableCostOverage
            : 0.0;
        $totalPlanCost = $totalFixedCost + $totalPlanVariableCost;
        $totalActualCost = $totalActualDurationMinutes > 0
            ? $totalFixedCost + $totalActualVariableCost
            : 0.0;
        $plannedFixedCostsByTaskId = $this->plannedFixedCostsByTask(
            tasks: $tasks,
            totalFixedCost: $totalFixedCost,
            totalEstimatedMinutes: $totalEstimatedMinutes,
            usesTaskMasterFixedCost: $fixedCostData['uses_task_master'],
        );
        $cumulativePlanCost = 0.0;
        $cumulativeActualCost = 0.0;

        $points = $tasks
            ->values()
            ->map(function (Task $task, int $index) use (
                $durationsByTaskId,
                $plannedFixedCostsByTaskId,
                $totalActualDurationMinutes,
                $totalActualVariableCost,
                $totalFixedCost,
                &$cumulativeActualCost,
                &$cumulativePlanCost,
            ): array {
                $estimatedMinutes = (int) $task->time_require;
                $actualDurationMinutes = (int) $durationsByTaskId->get($task->id, 0);
                $planFixedCost = (float) $plannedFixedCostsByTaskId->get($task->id, 0.0);
                $planVariableCost = (float) $task->variableCostTotal();
                $planCost = $planFixedCost + $planVariableCost;
                $actualAllocationRatio = $totalActualDurationMinutes > 0
                    ? $actualDurationMinutes / $totalActualDurationMinutes
                    : 0.0;
                $actualFixedCost = $actualAllocationRatio * $totalFixedCost;
                $actualVariableCost = $actualAllocationRatio * $totalActualVariableCost;
                $actualCost = $actualFixedCost + $actualVariableCost;

                $cumulativePlanCost += $planCost;
                $cumulativeActualCost += $actualCost;

                return [
                    'process' => $index + 1,
                    'task_id' => $task->id,
                    'task_name' => $task->name,
                    'estimated_minutes' => $estimatedMinutes,
                    'actual_duration_minutes' => $actualDurationMinutes,
                    'plan_fixed_cost' => round($planFixedCost, 2),
                    'plan_variable_cost' => round($planVariableCost, 2),
                    'plan_cost' => round($planCost, 2),
                    'actual_fixed_cost' => round($actualFixedCost, 2),
                    'actual_variable_cost' => round($actualVariableCost, 2),
                    'actual_cost' => round($actualCost, 2),
                    'cumulative_plan_cost' => round($cumulativePlanCost, 2),
                    'cumulative_actual_cost' => round($cumulativeActualCost, 2),
                ];
            })
            ->all();
        $normalizedPlanRevenue = $this->numericValue($planRevenue);
        $normalizedActualRevenue = $this->numericValue($actualRevenue);

        return [
            'fixed_cost' => round($totalFixedCost, 2),
            'total_variable_cost' => round($totalPlanVariableCost, 2),
            'total_actual_variable_cost' => round($totalActualVariableCost, 2),
            'total_estimated_minutes' => $totalEstimatedMinutes,
            'total_actual_duration_minutes' => $totalActualDurationMinutes,
            'total_plan_cost' => round($totalPlanCost, 2),
            'total_actual_cost' => round($totalActualCost, 2),
            'plan_revenue' => $normalizedPlanRevenue,
            'actual_revenue' => $normalizedActualRevenue,
            'plan_ebitda' => $normalizedPlanRevenue !== null
                ? round($normalizedPlanRevenue - $totalPlanCost, 2)
                : null,
            'actual_ebitda' => $normalizedActualRevenue !== null
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

        $selectedTaskIds = $businessDate->isSameDay(
            CarbonImmutable::now((string) config('app.kdkmp_business_timezone'))
        )
            ? $this->taskSelection->executionTaskIdsForUser($user, $businessDate)
            : $this->taskSelection->dailySelectedTaskIdsForUser($user, $businessDate);

        return Task::query()
            ->active()
            ->whereHas('roles', function (Builder $query) use ($user): void {
                $query->whereKey($user->role_id);
            })
            ->when(
                $user->isKdkmpManager(),
                fn (Builder $query) => $query->forKdkmpExecution(
                    $selectedTaskIds,
                )
            )
            ->orderByRaw('CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get([
                'id',
                'name',
                'time_require',
                'fixed_cost',
                'variable_cost',
            ]);
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @return array{total: float, uses_task_master: bool}
     */
    private function fixedCostDataFor(Collection $tasks): array
    {
        if (
            $tasks->isNotEmpty()
            && $tasks->every(fn (Task $task): bool => $task->hasConfiguredFixedCost())
        ) {
            return [
                'total' => (float) $tasks->sum(
                    fn (Task $task): int => $task->fixedCostTotal()
                ),
                'uses_task_master' => true,
            ];
        }

        return [
            'total' => (float) self::DEFAULT_DAILY_FIXED_COST,
            'uses_task_master' => false,
        ];
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @return Collection<int, float>
     */
    private function plannedFixedCostsByTask(
        Collection $tasks,
        float $totalFixedCost,
        int $totalEstimatedMinutes,
        bool $usesTaskMasterFixedCost,
    ): Collection {
        if ($tasks->isEmpty()) {
            return collect();
        }

        if ($usesTaskMasterFixedCost) {
            return $tasks->mapWithKeys(
                fn (Task $task): array => [$task->id => (float) $task->fixedCostTotal()]
            );
        }

        $allocationUnits = $totalEstimatedMinutes > 0
            ? $totalEstimatedMinutes
            : $tasks->count();
        $cumulativeFixedCost = 0.0;
        $lastTaskIndex = $tasks->count() - 1;

        return $tasks
            ->values()
            ->mapWithKeys(function (Task $task, int $index) use (
                $allocationUnits,
                $lastTaskIndex,
                $totalEstimatedMinutes,
                $totalFixedCost,
                &$cumulativeFixedCost,
            ): array {
                $allocationWeight = $totalEstimatedMinutes > 0
                    ? (int) $task->time_require
                    : 1;
                $allocatedFixedCost = $index === $lastTaskIndex
                    ? $totalFixedCost - $cumulativeFixedCost
                    : ($allocationWeight / $allocationUnits) * $totalFixedCost;
                $cumulativeFixedCost += $allocatedFixedCost;

                return [$task->id => $allocatedFixedCost];
            });
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
