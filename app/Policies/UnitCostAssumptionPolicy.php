<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\UnitCostAssumption;
use App\Models\User;

class UnitCostAssumptionPolicy
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

    public function view(User $user, UnitCostAssumption $unitCostAssumption): bool
    {
        return $user->isEbitdaKdkmp()
            && $unitCostAssumption->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isEbitdaKdkmp();
    }

    public function update(User $user, UnitCostAssumption $unitCostAssumption): bool
    {
        return $user->isEbitdaKdkmp()
            && $unitCostAssumption->user_id === $user->id;
    }
}
