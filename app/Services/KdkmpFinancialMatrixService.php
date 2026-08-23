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
    private const DEFAULT_DAILY_FIXED_COST = 9_235_467;

    public function __construct(
        private readonly KdkmpTaskSelectionService $taskSelection,
    ) {}

    /**
     * @return array{fixed_cost: float, total_variable_cost: float, total_actual_variable_cost: float, total_estimated_minutes: int, total_actual_duration_minutes: int, total_plan_cost: float, total_actual_cost: float|null, plan_revenue: float|null, actual_revenue: float|null, plan_ebitda: float|null, actual_ebitda: float|null, points: array<int, array{process: int, task_id: int, task_name: string, estimated_minutes: int, actual_duration_minutes: int, variable_cost: float|null, actual_cost: float|null, cumulative_variable_cost: float|null, cumulative_actual_cost: float|null}>}
     */
    public function forUser(
        User $user,
        CarbonImmutable $businessDate,
        mixed $planRevenue,
        mixed $actualRevenue,
        mixed $variableCost,
        mixed $actualVariableCost,
    ): array {
        $tasks = $this->tasksForUser($user, $businessDate);
        $fixedCost = $this->fixedCostFor($tasks);
        $variableCostData = $this->variableCostFor($tasks, $variableCost);
        $totalEstimatedMinutes = (int) $tasks->sum('time_require');
        $durationsByTaskId = $this->completedDurationsByTask(
            user: $user,
            businessDate: $businessDate,
            taskIds: $tasks->pluck('id'),
        );
        $totalActualDurationMinutes = (int) $durationsByTaskId->sum();
        $hasCostAllocation = $totalEstimatedMinutes > 0;
        $normalizedVariableCost = $variableCostData['total'];
        $usesTaskMasterVariableCost = $variableCostData['uses_task_master'];
        $cumulativeVariableCost = 0.0;
        $cumulativeActualCost = 0.0;
        $lastTaskIndex = $tasks->count() - 1;

        $points = $tasks
            ->values()
            ->map(function (Task $task, int $index) use (
                $durationsByTaskId,
                $hasCostAllocation,
                $lastTaskIndex,
                $totalEstimatedMinutes,
                $fixedCost,
                $usesTaskMasterVariableCost,
                &$cumulativeActualCost,
                &$cumulativeVariableCost,
                $normalizedVariableCost,
            ): array {
                $estimatedMinutes = (int) $task->time_require;
                $actualDurationMinutes = (int) $durationsByTaskId->get($task->id, 0);

                $allocatedVariableCost = $usesTaskMasterVariableCost
                    ? (float) $task->variableCostTotal()
                    : ($hasCostAllocation
                        ? ($index === $lastTaskIndex
                            ? $normalizedVariableCost - $cumulativeVariableCost
                            : ($estimatedMinutes / $totalEstimatedMinutes) * $normalizedVariableCost)
                        : null);
                $actualCost = $hasCostAllocation
                    ? ($actualDurationMinutes / $totalEstimatedMinutes) * $fixedCost
                    : null;

                if ($allocatedVariableCost !== null) {
                    $cumulativeVariableCost += $allocatedVariableCost;
                }

                if ($actualCost !== null) {
                    $cumulativeActualCost += $actualCost;
                }

                return [
                    'process' => $index + 1,
                    'task_id' => $task->id,
                    'task_name' => $task->name,
                    'estimated_minutes' => $estimatedMinutes,
                    'actual_duration_minutes' => $actualDurationMinutes,
                    'variable_cost' => $allocatedVariableCost !== null
                        ? round($allocatedVariableCost, 2)
                        : null,
                    'actual_cost' => $actualCost !== null ? round($actualCost, 2) : null,
                    'cumulative_variable_cost' => $allocatedVariableCost !== null
                        ? round($cumulativeVariableCost, 2)
                        : null,
                    'cumulative_actual_cost' => $actualCost !== null
                        ? round($cumulativeActualCost, 2)
                        : null,
                ];
            })
            ->all();

        $totalPlanCost = round($fixedCost + $normalizedVariableCost, 2);
        $totalActualCost = $hasCostAllocation ? round($cumulativeActualCost, 2) : null;
        $normalizedPlanRevenue = $this->numericValue($planRevenue);
        $normalizedActualRevenue = $this->numericValue($actualRevenue);
        $normalizedActualVariableCost = $this->numericValue($actualVariableCost) ?? 0.0;

        return [
            'fixed_cost' => $fixedCost,
            'total_variable_cost' => round($normalizedVariableCost, 2),
            'total_actual_variable_cost' => round($normalizedActualVariableCost, 2),
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

        return Task::query()
            ->active()
            ->whereHas('roles', function (Builder $query) use ($user): void {
                $query->whereKey($user->role_id);
            })
            ->when(
                $user->isKdkmpManager(),
                fn (Builder $query) => $query->forKdkmpExecution(
                    $this->taskSelection->executionTaskIdsForUser($user, $businessDate),
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
     */
    private function fixedCostFor(Collection $tasks): float
    {
        if (
            $tasks->isEmpty() ||
            ! $tasks->every(fn (Task $task): bool => $task->fixedCostTotal() > 0)
        ) {
            return (float) self::DEFAULT_DAILY_FIXED_COST;
        }

        return (float) $tasks->sum(
            fn (Task $task): int => $task->fixedCostTotal()
        );
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @return array{total: float, uses_task_master: bool}
     */
    private function variableCostFor(Collection $tasks, mixed $fallbackVariableCost): array
    {
        if (
            $tasks->isNotEmpty() &&
            $tasks->every(fn (Task $task): bool => $task->variableCostTotal() > 0)
        ) {
            return [
                'total' => (float) $tasks->sum(
                    fn (Task $task): int => $task->variableCostTotal()
                ),
                'uses_task_master' => true,
            ];
        }

        return [
            'total' => $this->numericValue($fallbackVariableCost) ?? 0.0,
            'uses_task_master' => false,
        ];
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
