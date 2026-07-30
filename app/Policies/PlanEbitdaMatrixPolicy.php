<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\PlanEbitdaMatrix;
use App\Models\User;

class PlanEbitdaMatrixPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if (
            $user->role?->level === RoleLevel::Superadmin
            && in_array($ability, ['viewAny', 'view'], true)
        ) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isEbitdaKdkmp();
    }

    public function view(User $user, PlanEbitdaMatrix $planEbitdaMatrix): bool
    {
        return $user->isEbitdaKdkmp()
            && $planEbitdaMatrix->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isEbitdaKdkmp();
    }

    public function update(User $user, PlanEbitdaMatrix $planEbitdaMatrix): bool
    {
        return $user->isEbitdaKdkmp()
            && $planEbitdaMatrix->user_id === $user->id;
    }
}
