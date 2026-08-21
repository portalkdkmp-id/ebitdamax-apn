<?php

namespace App\Services;

use App\Enums\TaskReportStatus;
use App\Models\EbitdamaxKdkmp;
use App\Models\Task;
use App\Models\TaskReport;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class KdkmpTaskSelectionService
{
    /**
     * @return Collection<int, Task>
     */
    public function tasksForInput(User $user, CarbonImmutable $businessDate): Collection
    {
        if ($user->role_id === null) {
            return collect();
        }

        $lockedTaskIds = $this->inProgressTaskIdsForUser($user);

        return Task::query()
            ->with('taskCategory:id,name,slug')
            ->active()
            ->whereHas('roles', function (Builder $query) use ($user): void {
                $query->whereKey($user->role_id);
            })
            ->orderByRaw('CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get([
                'id',
                'task_category_id',
                'bmc_status',
                'name',
                'description',
                'execution_time',
                'time_require',
                'is_mandatory',
            ])
            ->each(function (Task $task) use ($lockedTaskIds): void {
                $task->setAttribute('is_locked_for_today', $lockedTaskIds->contains($task->id));
            });
    }

    /**
     * @return Collection<int, int>
     */
    public function dailySelectedTaskIdsForUser(User $user, CarbonImmutable $businessDate): Collection
    {
        if ($user->sdm_kdkmp_entry_id === null) {
            return collect();
        }

        $entry = EbitdamaxKdkmp::query()
            ->where('sdm_kdkmp_entry_id', $user->sdm_kdkmp_entry_id)
            ->whereDate('report_date', $businessDate->toDateString())
            ->first(['selected_task_ids']);

        return collect($entry?->selectedTaskIds() ?? []);
    }

    /**
     * @return Collection<int, int>
     */
    public function executionTaskIdsForUser(User $user, CarbonImmutable $businessDate): Collection
    {
        return $this->dailySelectedTaskIdsForUser($user, $businessDate)
            ->merge($this->inProgressTaskIdsForUser($user))
            ->unique()
            ->values();
    }

    /**
     * @param  Collection<int, int>  $sdmKdkmpEntryIds
     * @return Collection<string, Collection<int, int>>
     */
    public function dailySelectedTaskIdsByKdkmpEntryAndDate(
        Collection $sdmKdkmpEntryIds,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
    ): Collection {
        if ($sdmKdkmpEntryIds->isEmpty()) {
            return collect();
        }

        return EbitdamaxKdkmp::query()
            ->whereIn('sdm_kdkmp_entry_id', $sdmKdkmpEntryIds)
            ->whereBetween('report_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->get(['sdm_kdkmp_entry_id', 'report_date', 'selected_task_ids'])
            ->mapWithKeys(fn (EbitdamaxKdkmp $entry): array => [
                $this->dailySelectionKey(
                    (int) $entry->sdm_kdkmp_entry_id,
                    $entry->report_date->toDateString(),
                ) => collect($entry->selectedTaskIds())->flip(),
            ]);
    }

    /**
     * @return Collection<int, int>
     */
    public function selectableTaskIdsForUser(User $user): Collection
    {
        if ($user->role_id === null) {
            return collect();
        }

        return Task::query()
            ->active()
            ->where('is_mandatory', false)
            ->whereHas('roles', function (Builder $query) use ($user): void {
                $query->whereKey($user->role_id);
            })
            ->pluck('id')
            ->map(fn (mixed $taskId): int => (int) $taskId);
    }

    /**
     * @return Collection<int, int>
     */
    public function inProgressTaskIdsForUser(User $user): Collection
    {
        return TaskReport::query()
            ->where('user_id', $user->id)
            ->where('status', TaskReportStatus::InProgress->value)
            ->whereHas('task', fn (Builder $query) => $query->where('is_mandatory', false))
            ->pluck('task_id')
            ->map(fn (mixed $taskId): int => (int) $taskId)
            ->unique()
            ->values();
    }

    public function canStartTask(User $user, Task $task, CarbonImmutable $businessDate): bool
    {
        if (! $user->isKdkmpManager()) {
            return true;
        }

        return Task::query()
            ->whereKey($task->id)
            ->forKdkmpExecution($this->executionTaskIdsForUser($user, $businessDate))
            ->exists();
    }

    private function dailySelectionKey(int $sdmKdkmpEntryId, string $businessDate): string
    {
        return $sdmKdkmpEntryId.'|'.$businessDate;
    }
}
