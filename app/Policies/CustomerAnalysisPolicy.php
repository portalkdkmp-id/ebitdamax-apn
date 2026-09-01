<?php

namespace App\Policies;

use App\Models\CustomerAnalysis;
use App\Models\User;

class CustomerAnalysisPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isKdkmpManager();
    }

    public function view(User $user, CustomerAnalysis $customerAnalysis): bool
    {
        return $user->isKdkmpManager()
            && $customerAnalysis->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isKdkmpManager();
    }

    public function update(User $user, CustomerAnalysis $customerAnalysis): bool
    {
        return $user->isKdkmpManager()
            && $customerAnalysis->user_id === $user->id;
    }
}
