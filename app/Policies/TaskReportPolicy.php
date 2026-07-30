<?php

namespace App\Policies;

use App\Enums\RoleLevel;
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
        return $taskReport->user_id === $user->id;
    }
}
