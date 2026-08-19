<?php

namespace App\Services;

use App\Enums\TaskPeriod;
use App\Enums\TaskReportStatus;
use App\Enums\TaskType;
use App\Models\Task;
use App\Models\TaskBmcDailySelection;
use App\Models\TaskReport;
use App\Models\TaskReportValue;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class KdkmpDashboardMetricsService
{
    private const EXPENSE_TASK_NAME = 'Catat pengeluaran harian';

    /**
     * @return array{actual_cost: string, total_duration: string, task_completion_rate: float, time_compliance_rate: float}
     */
    public function forUser(int $userId, CarbonImmutable $businessDate): array
    {
        return $this->forUsers([$userId], $businessDate)->get($userId, $this->emptyMetrics());
    }

    /**
     * @param  iterable<int, int>  $userIds
     * @return Collection<int, array{actual_cost: string, total_duration: string, task_completion_rate: float, time_compliance_rate: float}>
     */
    public function forUsers(iterable $userIds, CarbonImmutable $businessDate): Collection
    {
        $ids = collect($userIds)
            ->map(fn (mixed $userId): int => (int) $userId)
            ->filter(fn (int $userId): bool => $userId > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        $startOfDay = $businessDate->startOfDay()->utc();
        $endOfDay = $businessDate->endOfDay()->utc();

        $users = User::query()
            ->whereIn('id', $ids)
            ->get(['id', 'role_id'])
            ->keyBy('id');
        $roleIds = $users->pluck('role_id')->filter()->unique()->values();

        $tasksByRole = $this->tasksByRole($roleIds);
        $selectedBmcPointByUser = TaskBmcDailySelection::query()
            ->whereIn('user_id', $ids)
            ->whereDate('selection_date', $businessDate->toDateString())
            ->pluck('bmc_point_id', 'user_id');

        $completedReportsByUser = TaskReport::query()
            ->whereIn('user_id', $ids)
            ->where('status', TaskReportStatus::Completed->value)
            ->whereBetween('finished_at', [$startOfDay, $endOfDay])
            ->get(['id', 'user_id', 'task_id', 'duration_minutes'])
            ->groupBy('user_id');

        $completedOnceBeforeDateByUser = TaskReport::query()
            ->join('tasks', 'tasks.id', '=', 'task_reports.task_id')
            ->whereIn('task_reports.user_id', $ids)
            ->where('task_reports.status', TaskReportStatus::Completed->value)
            ->where('tasks.period', TaskPeriod::Once->value)
            ->where('task_reports.finished_at', '<', $startOfDay)
            ->get(['task_reports.user_id', 'task_reports.task_id'])
            ->groupBy('user_id')
            ->map(fn (Collection $reports): Collection => $reports->pluck('task_id')->unique());

        $expenseTotalsByUser = TaskReportValue::query()
            ->join('task_reports', 'task_reports.id', '=', 'task_report_values.task_report_id')
            ->join('tasks', 'tasks.id', '=', 'task_reports.task_id')
            ->whereIn('task_reports.user_id', $ids)
            ->where('task_reports.status', TaskReportStatus::Completed->value)
            ->whereBetween('task_reports.finished_at', [$startOfDay, $endOfDay])
            ->where('tasks.name', self::EXPENSE_TASK_NAME)
            ->get(['task_reports.user_id', 'task_report_values.value'])
            ->groupBy('user_id')
            ->map(function (Collection $values): string {
                $total = $values->sum(function (TaskReportValue $value): float {
                    return $this->numericValue($value->value) ?? 0.0;
                });

                return $this->formatNumber($total);
            });

        return $ids->mapWithKeys(function (int $userId) use (
            $completedOnceBeforeDateByUser,
            $completedReportsByUser,
            $expenseTotalsByUser,
            $tasksByRole,
            $selectedBmcPointByUser,
            $users
        ): array {
            $roleId = $users->get($userId)?->role_id;
            $assignedTasks = $roleId !== null
                ? $tasksByRole->get((int) $roleId, collect())
                : collect();
            $completedOnceTaskIds = $completedOnceBeforeDateByUser->get($userId, collect());
            $selectedBmcPointId = $selectedBmcPointByUser->get($userId);
            $assignedTasks = $assignedTasks
                ->reject(fn (Task $task): bool => $task->period === TaskPeriod::Once
                    && $completedOnceTaskIds->contains($task->id))
                ->reject(fn (Task $task): bool => $task->task_type === TaskType::KegiatanStrategisPilihan
                    && $task->bmc_point_id !== $selectedBmcPointId)
                ->keyBy('id');
            $userCompletedReports = $completedReportsByUser->get($userId, collect());
            $completedReports = $userCompletedReports
                ->filter(fn (TaskReport $report): bool => $assignedTasks->has($report->task_id))
                ->unique('task_id');
            $durationMinutes = (int) $userCompletedReports->sum('duration_minutes');
            $reportsWithThreshold = $completedReports->filter(function (TaskReport $report) use ($assignedTasks): bool {
                $task = $assignedTasks->get($report->task_id);

                return $task instanceof Task
                    && $task->lower_time_threshold_minutes !== null
                    && $task->upper_time_threshold_minutes !== null;
            });
            $reportsWithinThreshold = $reportsWithThreshold->filter(function (TaskReport $report) use ($assignedTasks): bool {
                $task = $assignedTasks->get($report->task_id);

                return $task instanceof Task
                    && $report->duration_minutes !== null
                    && $report->duration_minutes >= $task->lower_time_threshold_minutes
                    && $report->duration_minutes <= $task->upper_time_threshold_minutes;
            });

            return [
                $userId => [
                    'actual_cost' => (string) $expenseTotalsByUser->get($userId, '0'),
                    'total_duration' => $this->formatDuration($durationMinutes),
                    'task_completion_rate' => $this->percentage(
                        $completedReports->count(),
                        $assignedTasks->count()
                    ),
                    'time_compliance_rate' => $this->percentage(
                        $reportsWithinThreshold->count(),
                        $reportsWithThreshold->count()
                    ),
                ],
            ];
        });
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
                'period',
                'task_type',
                'bmc_point_id',
                'lower_time_threshold_minutes',
                'upper_time_threshold_minutes',
            ])
            ->active()
            ->whereHas('roles', fn ($query) => $query->whereIn('roles.id', $roleIds))
            ->with(['roles' => fn ($query) => $query->select('roles.id')])
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

    private function percentage(int $numerator, int $denominator): float
    {
        if ($denominator === 0) {
            return 0.0;
        }

        return round(min(100, max(0, ($numerator / $denominator) * 100)), 4);
    }

    private function numericValue(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $normalized = preg_replace('/\s+/u', '', trim($value));
        $normalized = preg_replace('/^rp\.?/i', '', (string) $normalized);

        if ($normalized === '' || preg_match('/^[+-]?\d+(?:[.,]\d+)*$/', $normalized) !== 1) {
            return null;
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

        return is_numeric($normalized) ? (float) $normalized : null;
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

    private function formatNumber(float $value): string
    {
        return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
    }

    private function formatDuration(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $remainingMinutes = $minutes % 60;

        if ($hours === 0) {
            return $remainingMinutes.' menit';
        }

        if ($remainingMinutes === 0) {
            return $hours.' jam';
        }

        return $hours.' jam '.$remainingMinutes.' menit';
    }

    /**
     * @return array{actual_cost: string, total_duration: string, task_completion_rate: float, time_compliance_rate: float}
     */
    private function emptyMetrics(): array
    {
        return [
            'actual_cost' => '0',
            'total_duration' => '0 menit',
            'task_completion_rate' => 0.0,
            'time_compliance_rate' => 0.0,
        ];
    }
}
