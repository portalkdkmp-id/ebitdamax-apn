<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\User;

class EbitdamaxKdkmpPolicy
{
    public function viewDashboard(User $user): bool
    {
        return $user->isKdkmpManager();
    }

    public function upsert(User $user): bool
    {
        return $user->isKdkmpManager()
            && $user->sdm_kdkmp_entry_id !== null;
    }

    public function viewMonitoring(User $user): bool
    {
        if ($user->role?->level === RoleLevel::Superadmin) {
            return true;
        }

        if (
            ! $user->isRegionalManager()
            && ! $user->isEbitdaKdkmp()
            && ! $user->isKdkmpManager()
        ) {
            return false;
        }

        return $user->sdm_kdkmp_entry_id !== null
            || $user->regionalAssignments()->exists();
    }
}
