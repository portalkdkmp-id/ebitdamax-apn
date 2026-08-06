<?php

namespace App\Http\Controllers;

use App\Enums\RoleDomain;
use App\Enums\RoleLevel;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $domain = $this->requestedDomain($request);
        $search = trim((string) $request->input('search', ''));
        $sort = (string) $request->input('sort', 'name');
        $direction = (string) $request->input('direction', 'asc');

        $sort = in_array($sort, ['name', 'level', 'created_at'], true) ? $sort : 'name';
        $direction = $direction === 'desc' ? 'desc' : 'asc';

        $roles = Role::query()
            ->where('domain', $domain->value)
            ->when(
                Schema::hasColumn('users', 'role_id'),
                fn ($query) => $query->withCount('users')
            )
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($subQuery) use ($search): void {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('level', 'like', "%{$search}%");
                });
            })
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate(15)
            ->through(fn (Role $role): array => $this->transformRole($role))
            ->appends($request->only(['domain', 'search', 'sort', 'direction']));

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'levelOptions' => RoleLevel::options(),
            'filters' => [
                'domain' => $domain->value,
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        Role::query()->create($this->prepareRolePayload($request->validated()));

        return back()->with('success', 'Role berhasil ditambahkan.');
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $this->ensureRoleBelongsToDomain($role, $this->requestedDomain($request));

        $role->update($this->prepareRolePayload($request->validated()));

        return back()->with('success', 'Role berhasil diperbarui.');
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        $this->ensureRoleBelongsToDomain($role, $this->requestedDomain($request));

        if (Schema::hasColumn('users', 'role_id') && $role->users()->exists()) {
            return back()->with('error', 'Role tidak dapat dihapus karena sudah digunakan oleh user.');
        }

        if (Schema::hasTable('tasks') && $role->tasks()->exists()) {
            return back()->with('error', 'Role tidak dapat dihapus karena sudah digunakan oleh task.');
        }

        $role->delete();

        return back()->with('success', 'Role berhasil dihapus.');
    }

    /**
     * @param  array{domain: string, name: string, level: string}  $payload
     * @return array{domain: string, name: string, slug: string, level: string}
     */
    private function prepareRolePayload(array $payload): array
    {
        return [
            'domain' => $payload['domain'],
            'name' => $payload['name'],
            'slug' => Str::slug($payload['name']),
            'level' => $payload['level'],
        ];
    }

    /**
     * @return array{
     *     id: int,
     *     uuid: string,
     *     domain: string,
     *     name: string,
     *     slug: string,
     *     level: string,
     *     level_label: string,
     *     users_count: int,
     *     created_at: string|null,
     *     updated_at: string|null
     * }
     */
    private function transformRole(Role $role): array
    {
        return [
            'id' => $role->id,
            'uuid' => $role->uuid,
            'domain' => $role->domain->value,
            'name' => $role->name,
            'slug' => $role->slug,
            'level' => $role->level->value,
            'level_label' => $role->level->label(),
            'users_count' => (int) ($role->users_count ?? 0),
            'created_at' => $role->created_at?->toIso8601String(),
            'updated_at' => $role->updated_at?->toIso8601String(),
        ];
    }

    private function requestedDomain(Request $request): RoleDomain
    {
        $domain = RoleDomain::tryFrom(
            (string) $request->input('domain', RoleDomain::Apn->value),
        );

        abort_if($domain === null, 404);

        return $domain;
    }

    private function ensureRoleBelongsToDomain(Role $role, RoleDomain $domain): void
    {
        abort_unless($role->domain === $domain, 404);
    }
}
