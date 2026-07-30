<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\MeetingMinute;
use App\Models\User;

class MeetingMinutePolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role?->level === RoleLevel::Superadmin) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, MeetingMinute $meetingMinute): bool
    {
        return $meetingMinute->created_by === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, MeetingMinute $meetingMinute): bool
    {
        return $meetingMinute->created_by === $user->id;
    }

    public function delete(User $user, MeetingMinute $meetingMinute): bool
    {
        return $meetingMinute->created_by === $user->id;
    }

    public function restore(User $user, MeetingMinute $meetingMinute): bool
    {
        return $meetingMinute->created_by === $user->id;
    }

    public function forceDelete(User $user, MeetingMinute $meetingMinute): bool
    {
        return $meetingMinute->created_by === $user->id;
    }
}
