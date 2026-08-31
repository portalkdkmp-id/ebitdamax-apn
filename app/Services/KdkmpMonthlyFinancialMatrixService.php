<?php

namespace App\Services;

use App\Enums\TaskReportStatus;
use App\Models\EbitdamaxKdkmp;
use App\Models\SdmKdkmpEntry;
use App\Models\Task;
use App\Models\TaskReport;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

class KdkmpMonthlyFinancialMatrixService
{
    /**
     * Build financial chart points for all KDKMP entries visible to the current user.
     *
     * The queries are intentionally performed in bulk. The monitoring dashboard can
     * contain thousands of KDKMP entries, so delegating to the per-user matrix
     * service would create a query for every entry on every business day.
     *
     * @return array{start_date: string, end_date: string, has_data: bool, points: array<int, array{date: string, plan_cost: float, actual_cost: float, cumulative_plan_cost: float, cumulative_actual_cost: float, plan_revenue: float, actual_revenue: float}>}
     */
    public function forEntries(
        Builder $kdkmpEntries,
        CarbonImmutable $periodStart,
        CarbonImmutable $periodEnd,
    ): array {
        /** @var Collection<int, SdmKdkmpEntry> $entries */
        $entries = (clone $kdkmpEntries)
            ->with('managerUser:id,role_id,sdm_kdkmp_entry_id')
            ->get(['id']);

        $dates = $this->datesBetween($periodStart, $periodEnd);

        if ($entries->isEmpty()) {
            return [
                'start_date' => $periodStart->toDateString(),
                'end_date' => $periodEnd->toDateString(),
                'has_data' => false,
                'points' => $dates->map(fn (CarbonImmutable $date): array => [
                    'date' => $date->toDateString(),
                    'plan_cost' => 0.0,
                    'actual_cost' => 0.0,
                    'cumulative_plan_cost' => 0.0,
                    'cumulative_actual_cost' => 0.0,
                    'plan_revenue' => 0.0,
                    'actual_revenue' => 0.0,
                ])->all(),
            ];
        }

        $entriesByManagerId = $entries
            ->filter(fn (SdmKdkmpEntry $entry): bool => $entry->managerUser !== null)
            ->mapWithKeys(
                fn (SdmKdkmpEntry $entry): array => [$entry->managerUser->id => $entry]
            );
        $managerUserIds = $entriesByManagerId->keys()->map(
            fn (mixed $userId): int => (int) $userId
        );
        $recordsByEntryAndDate = $this->dailyRecordsByEntryAndDate(
            $entries->pluck('id'),
            $periodStart,
            $periodEnd,
        );
        $tasksByRole = $this->tasksByRole(
            $entriesByManagerId->map(
                fn (SdmKdkmpEntry $entry): ?int => $entry->managerUser?->role_id
            )
                ->filter()
                ->unique()
                ->values(),
        );
        $completedReportsByManagerAndDate = $this->completedReportsByManagerAndDate(
            $managerUserIds,
            $periodStart,
            $periodEnd,
        );
        $cumulativePlanCost = 0.0;
        $cumulativeActualCost = 0.0;

        return [
            'start_date' => $periodStart->toDateString(),
            'end_date' => $periodEnd->toDateString(),
            'has_data' => $entriesByManagerId->isNotEmpty(),
            'points' => $dates->map(function (CarbonImmutable $date) use (
                $completedReportsByManagerAndDate,
                $entriesByManagerId,
                $recordsByEntryAndDate,
                $tasksByRole,
                &$cumulativeActualCost,
                &$cumulativePlanCost,
            ): array {
                $dateKey = $date->toDateString();
                $planCost = 0.0;
                $actualCost = 0.0;
                $planRevenue = 0.0;
                $actualRevenue = 0.0;

                foreach ($entriesByManagerId as $managerUserId => $entry) {
                    $record = $recordsByEntryAndDate->get(
                        $this->dailyRecordKey($entry->id, $dateKey)
                    );
                    $tasks = $this->executionTasksForEntry(
                        $entry,
                        $record,
                        $tasksByRole,
                    );
                    $taskIds = $tasks->pluck('id')->flip();
                    $totalActualDuration = (int) $completedReportsByManagerAndDate
                        ->get($this->managerDateKey((int) $managerUserId, $dateKey), collect())
                        ->filter(
                            fn (TaskReport $report): bool => $taskIds->has($report->task_id)
                        )
                        ->sum(
                            fn (TaskReport $report): int => $report->duration_minutes ?? 0
                        );
                    $fixedCost = $this->fixedCostFor($tasks);
                    $variableCost = (float) $tasks->sum(
                        fn (Task $task): int => $task->variableCostTotal()
                    );
                    $actualVariableOverage = $record instanceof EbitdamaxKdkmp
                        ? $this->numericValue($record->actual_variable_cost)
                        : 0.0;

                    $planCost += $fixedCost + $variableCost;

                    if ($totalActualDuration > 0) {
                        $actualCost += $fixedCost + $variableCost + $actualVariableOverage;
                    }

                    if ($record instanceof EbitdamaxKdkmp) {
                        $planRevenue += $this->numericValue($record->plan_revenue);
                        $actualRevenue += $this->numericValue($record->actual_revenue);
                    }
                }

                $cumulativePlanCost += $planCost;
                $cumulativeActualCost += $actualCost;

                return [
                    'date' => $dateKey,
                    'plan_cost' => round($planCost, 2),
                    'actual_cost' => round($actualCost, 2),
                    'cumulative_plan_cost' => round($cumulativePlanCost, 2),
                    'cumulative_actual_cost' => round($cumulativeActualCost, 2),
                    'plan_revenue' => round($planRevenue, 2),
                    'actual_revenue' => round($actualRevenue, 2),
                ];
            })->all(),
        ];
    }

    /**
     * @param  Collection<int, int>  $entryIds
     * @return Collection<string, EbitdamaxKdkmp>
     */
    private function dailyRecordsByEntryAndDate(
        Collection $entryIds,
        CarbonImmutable $periodStart,
        CarbonImmutable $periodEnd,
    ): Collection {
        if ($entryIds->isEmpty()) {
            return collect();
        }

        return EbitdamaxKdkmp::query()
            ->whereIn('sdm_kdkmp_entry_id', $entryIds)
            ->whereBetween('report_date', [
                $periodStart->toDateString(),
                $periodEnd->toDateString(),
            ])
            ->get([
                'id',
                'sdm_kdkmp_entry_id',
                'report_date',
                'selected_task_ids',
                'plan_revenue',
                'actual_revenue',
                'actual_variable_cost',
            ])
            ->mapWithKeys(
                fn (EbitdamaxKdkmp $record): array => [
                    $this->dailyRecordKey(
                        $record->sdm_kdkmp_entry_id,
                        $record->report_date->toDateString(),
                    ) => $record,
                ]
            );
    }

    /**
     * @param  Collection<int, int>  $roleIds
     * @return Collection<int, Collection<int, Task>>
     */
    private function tasksByRole(Collection $roleIds): Collection
    {
        if ($roleIds->isEmpty()) {
            return collect();
        }

        $tasks = Task::query()
            ->select([
                'id',
                'time_require',
                'is_mandatory',
                'fixed_cost',
                'variable_cost',
            ])
            ->active()
            ->whereHas('roles', function (Builder $query) use ($roleIds): void {
                $query->whereIn('roles.id', $roleIds);
            })
            ->with([
                'roles' => function (BelongsToMany $query) use ($roleIds): void {
                    $query->whereIn('roles.id', $roleIds)->select('roles.id');
                },
            ])
            ->get();
        $tasksByRole = collect();

        foreach ($tasks as $task) {
            foreach ($task->roles as $role) {
                $roleId = (int) $role->id;
                $tasksByRole->put(
                    $roleId,
                    $tasksByRole->get($roleId, collect())->push($task)
                );
            }
        }

        return $tasksByRole;
    }

    /**
     * @param  Collection<int, int>  $managerUserIds
     * @return Collection<string, Collection<int, TaskReport>>
     */
    private function completedReportsByManagerAndDate(
        Collection $managerUserIds,
        CarbonImmutable $periodStart,
        CarbonImmutable $periodEnd,
    ): Collection {
        if ($managerUserIds->isEmpty()) {
            return collect();
        }

        return TaskReport::query()
            ->whereIn('user_id', $managerUserIds)
            ->where('status', TaskReportStatus::Completed->value)
            ->whereNotNull('finished_at')
            ->whereBetween('finished_at', [
                $periodStart->startOfDay()->utc(),
                $periodEnd->endOfDay()->utc(),
            ])
            ->get(['id', 'user_id', 'task_id', 'finished_at', 'duration_minutes'])
            ->groupBy(
                fn (TaskReport $report): string => $this->managerDateKey(
                    $report->user_id,
                    $this->businessDateFor($report->finished_at)
                )
            );
    }

    /**
     * @param  Collection<int, Task>  $tasks
     */
    private function fixedCostFor(Collection $tasks): float
    {
        if (
            $tasks->isNotEmpty()
            && $tasks->every(fn (Task $task): bool => $task->hasConfiguredFixedCost())
        ) {
            return (float) $tasks->sum(
                fn (Task $task): int => $task->fixedCostTotal()
            );
        }

        return (float) KdkmpFinancialMatrixService::DEFAULT_DAILY_FIXED_COST;
    }

    /**
     * @param  Collection<int, Collection<int, Task>>  $tasksByRole
     * @return Collection<int, Task>
     */
    private function executionTasksForEntry(
        SdmKdkmpEntry $entry,
        ?EbitdamaxKdkmp $record,
        Collection $tasksByRole,
    ): Collection {
        $manager = $entry->managerUser;

        if ($manager === null || $manager->role_id === null) {
            return collect();
        }

        $selectedTaskIds = $record?->selectedTaskIds() ?? [];
        $selectedTaskIdMap = collect($selectedTaskIds)->flip();

        return $tasksByRole
            ->get((int) $manager->role_id, collect())
            ->filter(
                fn (Task $task): bool => $task->is_mandatory
                    || $selectedTaskIdMap->has($task->id)
            )
            ->values();
    }

    /**
     * @return Collection<int, CarbonImmutable>
     */
    private function datesBetween(
        CarbonImmutable $periodStart,
        CarbonImmutable $periodEnd,
    ): Collection {
        $dates = collect();

        for ($date = $periodStart; $date->lte($periodEnd); $date = $date->addDay()) {
            $dates->push($date);
        }

        return $dates;
    }

    private function businessDateFor(CarbonInterface $date): string
    {
        return $date
            ->setTimezone((string) config('app.kdkmp_business_timezone'))
            ->toDateString();
    }

    private function dailyRecordKey(int $entryId, string $date): string
    {
        return $entryId.'|'.$date;
    }

    private function managerDateKey(int $managerUserId, string $date): string
    {
        return $managerUserId.'|'.$date;
    }

    private function numericValue(mixed $value): float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (! is_string($value)) {
            return 0.0;
        }

        $normalized = preg_replace('/\s+/u', '', trim($value));
        $normalized = preg_replace('/^rp\.?/i', '', (string) $normalized);

        if ($normalized === '' || preg_match('/^[+-]?\d+(?:[.,]\d+)*$/', $normalized) !== 1) {
            return 0.0;
        }

        $lastDot = strrpos($normalized, '.');
        $lastComma = strrpos($normalized, ',');

        if ($lastDot !== false && $lastComma !== false) {
            if ($lastComma > $lastDot) {
                $normalized = str_replace('.', '', $normalized);
                $normalized = str_replace(',', '.', $normalized);
            } else {
                $normalized = str_replace(',', '', $normalized);
            }
        } elseif ($lastDot !== false) {
            $normalized = $this->normalizeSingleSeparator($normalized, '.');
        } elseif ($lastComma !== false) {
            $normalized = $this->normalizeSingleSeparator($normalized, ',');
        }

        return is_numeric($normalized) ? (float) $normalized : 0.0;
    }

    private function normalizeSingleSeparator(string $value, string $separator): string
    {
        $separatorCount = substr_count($value, $separator);
        $decimalLength = strlen($value) - (int) strrpos($value, $separator) - 1;

        if ($separatorCount > 1 || $decimalLength === 3) {
            return str_replace($separator, '', $value);
        }

        return $separator === ',' ? str_replace(',', '.', $value) : $value;
    }
}
