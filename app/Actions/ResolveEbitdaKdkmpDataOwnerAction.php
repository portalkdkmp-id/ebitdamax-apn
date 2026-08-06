<?php

namespace App\Actions;

use App\Enums\RoleDomain;
use App\Enums\RoleLevel;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ResolveEbitdaKdkmpDataOwnerAction
{
    /**
     * @return array{
     *     owner: User,
     *     dataOwner: array{username: string, name: string, email: string},
     *     dataOwnerOptions: array<int, array{username: string, name: string, email: string}>,
     *     canSelectDataOwner: bool
     * }
     */
    public function handle(User $authenticatedUser, ?string $requestedUsername): array
    {
        $authenticatedUser->loadMissing('role:id,slug,level,domain');

        if ($authenticatedUser->isEbitdaKdkmp()) {
            return [
                'owner' => $authenticatedUser,
                'dataOwner' => $this->transform($authenticatedUser),
                'dataOwnerOptions' => [],
                'canSelectDataOwner' => false,
            ];
        }

        abort_unless($authenticatedUser->role?->level === RoleLevel::Superadmin, 403);

        $owners = User::query()
            ->select(['id', 'role_id', 'name', 'username', 'email'])
            ->whereNotNull('username')
            ->whereHas(
                'role',
                fn (Builder $query): Builder => $query
                    ->where('domain', RoleDomain::Kdkmp->value)
                    ->where('slug', Role::SLUG_EBITDA_KDKMP)
            )
            ->orderBy('name')
            ->orderBy('id')
            ->get();

        $owner = $requestedUsername === null
            ? $owners->first()
            : $owners->firstWhere('username', $requestedUsername);

        abort_if($owner === null, 404, 'User EBITDA KDKMP tidak ditemukan.');

        return [
            'owner' => $owner,
            'dataOwner' => $this->transform($owner),
            'dataOwnerOptions' => $owners
                ->map(fn (User $user): array => $this->transform($user))
                ->values()
                ->all(),
            'canSelectDataOwner' => true,
        ];
    }

    /**
     * @return array{username: string, name: string, email: string}
     */
    private function transform(User $user): array
    {
        return [
            'username' => (string) $user->username,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }
}
