<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\SdmKdkmpEntry;
use App\Models\TaskReport;
use App\Models\User;

class TaskReportPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if (
            $ability === 'view'
            && $user->role?->level === RoleLevel::Superadmin
        ) {
            return true;
        }

        return null;
    }

    public function view(User $user, TaskReport $taskReport): bool
    {
        if ($taskReport->user_id === $user->id) {
            return true;
        }

        if (
            ! $user->isRegionalManager()
            && ! $user->isEbitdaKdkmp()
        ) {
            return false;
        }

        return SdmKdkmpEntry::query()
            ->accessibleBy($user)
            ->whereHas('managerUser', function ($query) use ($taskReport): void {
                $query->whereKey($taskReport->user_id);
            })
            ->exists();
    }
}
