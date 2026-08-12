<?php

namespace App\Services;

use App\Enums\TaskReportStatus;
use App\Models\EbitdamaxKdkmp;
use App\Models\TaskReport;
use App\Models\User;
use Carbon\CarbonImmutable;

class KdkmpOperationalAllocationService
{
    /**
     * @param  array<string, mixed>|null  $attendance
     * @return array{allocated: array<string, int>, available: array<string, int>}
     */
    public function summaryForUser(
        User $user,
        CarbonImmutable $businessDate,
        ?array $attendance,
        ?int $exceptTaskReportId = null,
        bool $lockForUpdate = false,
    ): array {
        $totalAttendance = EbitdamaxKdkmp::normalizeOperationalAttendance($attendance);
        $allocated = $this->allocatedForUser(
            user: $user,
            businessDate: $businessDate,
            exceptTaskReportId: $exceptTaskReportId,
            lockForUpdate: $lockForUpdate,
        );
        $available = [];

        foreach (EbitdamaxKdkmp::OPERATIONAL_ATTENDANCE_ROLES as $key => $label) {
            $available[$key] = max(0, $totalAttendance[$key] - $allocated[$key]);
        }

        return [
            'allocated' => $allocated,
            'available' => $available,
        ];
    }

    /**
     * @return array<string, int>
     */
    private function allocatedForUser(
        User $user,
        CarbonImmutable $businessDate,
        ?int $exceptTaskReportId,
        bool $lockForUpdate,
    ): array {
        $query = TaskReport::query()
            ->where('user_id', $user->id)
            ->where('status', TaskReportStatus::InProgress->value)
            ->whereBetween('started_at', [
                $businessDate->startOfDay()->utc(),
                $businessDate->endOfDay()->utc(),
            ]);

        if ($exceptTaskReportId !== null) {
            $query->whereKeyNot($exceptTaskReportId);
        }

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $allocated = EbitdamaxKdkmp::normalizeOperationalAttendance(null);

        foreach ($query->get(['id', 'member_allocations']) as $report) {
            $memberAllocations = EbitdamaxKdkmp::normalizeOperationalAttendance(
                $report->member_allocations,
            );

            foreach (array_keys(EbitdamaxKdkmp::OPERATIONAL_ATTENDANCE_ROLES) as $key) {
                $allocated[$key] += $memberAllocations[$key];
            }
        }

        return $allocated;
    }
}
