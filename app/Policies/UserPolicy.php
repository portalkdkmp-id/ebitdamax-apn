<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the authenticated user can replace a Manager KDKMP SK.
     */
    public function uploadManagerSkDocument(User $user, User $manager): bool
    {
        return $user->role?->level === RoleLevel::Superadmin
            && $manager->isKdkmpManager();
    }

    /**
     * Determine whether the authenticated user can preview a Manager KDKMP SK.
     */
    public function viewManagerSkDocument(User $user, User $manager): bool
    {
        return $user->role?->level === RoleLevel::Superadmin
            || ($user->is($manager) && $manager->isKdkmpManager());
    }
}
