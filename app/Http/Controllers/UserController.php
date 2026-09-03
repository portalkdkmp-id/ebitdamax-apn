<?php

namespace App\Http\Controllers;

use App\Enums\RegionalScopeLevel;
use App\Enums\RoleDomain;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Role;
use App\Models\SdmKdkmpEntry;
use App\Models\User;
use App\Services\RegionalAccessService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly RegionalAccessService $regionalAccess,
    ) {}

    public function index(Request $request): Response
    {
        $domain = $this->requestedDomain($request);
        $search = trim((string) $request->input('search', ''));
        $roleId = $request->input('role_id');
        $sort = (string) $request->input('sort', 'name');
        $direction = (string) $request->input('direction', 'asc');

        $sort = in_array($sort, ['name', 'email', 'created_at'], true) ? $sort : 'name';
        $direction = $direction === 'desc' ? 'desc' : 'asc';

        $users = User::query()
            ->with(['role', 'regionalAssignments', 'sdmKdkmpEntry'])
            ->whereHas(
                'role',
                fn (Builder $query): Builder => $query->where('domain', $domain->value),
            )
            ->when($roleId, fn ($query) => $query->where('role_id', $roleId))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($subQuery) use ($search): void {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate(15)
            ->through(fn (User $user): array => $this->transformUser($user))
            ->appends($request->only(['domain', 'search', 'role_id', 'sort', 'direction']));

        $roles = Role::query()
            ->where('domain', $domain->value)
            ->ordered()
            ->get(['id', 'name', 'slug', 'level', 'domain'])
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'level' => $role->level->value,
                'level_label' => $role->level->label(),
                'domain' => $role->domain->value,
            ])
            ->values();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'regionOptions' => $domain === RoleDomain::Kdkmp
                ? $this->regionalAccess->allRegionOptions()
                : [],
            'kdkmpOptions' => $domain === RoleDomain::Kdkmp
                ? $this->kdkmpOptions()
                : [],
            'filters' => [
                'domain' => $domain->value,
                'search' => $search,
                'role_id' => $roleId ? (int) $roleId : null,
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $payload = $request->validated();
            $user = User::query()->create($this->prepareUserPayload($payload));

            $this->syncRegionalAssignments($user, $payload);
        });

        return back()->with('success', 'User berhasil ditambahkan.');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->ensureUserBelongsToDomain($user, $this->requestedDomain($request));

        DB::transaction(function () use ($request, $user): void {
            $payload = $request->validated();
            $user->update($this->prepareUserPayload($payload));

            $this->syncRegionalAssignments($user, $payload);
        });

        return back()->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->ensureUserBelongsToDomain($user, $this->requestedDomain($request));

        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }

    /**
     * @param  array{domain: string, role_id: int, name: string, email: string, password?: string|null, sdm_kdkmp_entry_id?: int|string|null, regional_assignments?: array<int, array{scope_level: string, provinsi: string, kota_kabupaten?: string|null, kecamatan?: string|null}>}  $payload
     * @return array<string, mixed>
     */
    private function prepareUserPayload(array $payload): array
    {
        $role = Role::query()->find($payload['role_id']);
        $isKdkmpManager = $role?->domain === RoleDomain::Kdkmp
            && $role->slug === Role::SLUG_KDKMP_MANAGER;

        $data = [
            'role_id' => $payload['role_id'],
            'sdm_kdkmp_entry_id' => $isKdkmpManager
                ? (int) ($payload['sdm_kdkmp_entry_id'] ?? 0)
                : null,
            'name' => $payload['name'],
            'email' => $payload['email'],
        ];

        if (! empty($payload['password'])) {
            $data['password'] = $payload['password'];
        }

        return $data;
    }

    /**
     * @param  array{domain: string, role_id: int, name: string, email: string, password?: string|null, sdm_kdkmp_entry_id?: int|string|null, regional_assignments?: array<int, array{scope_level: string, provinsi: string, kota_kabupaten?: string|null, kecamatan?: string|null}>}  $payload
     */
    private function syncRegionalAssignments(User $user, array $payload): void
    {
        $user->regionalAssignments()->delete();
        $user->load('role');

        if (
            ! $user->isRegionalManager()
            && ! $user->isEbitdaKdkmp()
        ) {
            return;
        }

        foreach ($payload['regional_assignments'] ?? [] as $assignment) {
            $scopeLevel = RegionalScopeLevel::from($assignment['scope_level']);

            $user->regionalAssignments()->create([
                'scope_level' => $scopeLevel,
                'provinsi' => $assignment['provinsi'],
                'kota_kabupaten' => $scopeLevel === RegionalScopeLevel::Province
                    ? null
                    : $assignment['kota_kabupaten'],
                'kecamatan' => $scopeLevel === RegionalScopeLevel::District
                    ? $assignment['kecamatan']
                    : null,
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'role_id' => $user->role_id,
            'sdm_kdkmp_entry_id' => $user->sdm_kdkmp_entry_id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'slug' => $user->role->slug,
                'level' => $user->role->level->value,
                'level_label' => $user->role->level->label(),
                'domain' => $user->role->domain->value,
            ] : null,
            'regional_assignments' => $user->regionalAssignments
                ->map(fn ($assignment): array => [
                    'id' => $assignment->id,
                    'scope_level' => $assignment->scope_level->value,
                    'provinsi' => $assignment->provinsi,
                    'kota_kabupaten' => $assignment->kota_kabupaten,
                    'kecamatan' => $assignment->kecamatan,
                ])
                ->values()
                ->all(),
            'kdkmp' => $user->sdmKdkmpEntry ? [
                'id' => $user->sdmKdkmpEntry->id,
                'nik' => $user->sdmKdkmpEntry->nik,
                'nama_koperasi' => $user->sdmKdkmpEntry->nama_koperasi,
                'provinsi' => $user->sdmKdkmpEntry->provinsi,
                'kota_kabupaten' => $user->sdmKdkmpEntry->kota_kabupaten,
                'kecamatan' => $user->sdmKdkmpEntry->kecamatan,
                'desa' => $user->sdmKdkmpEntry->desa,
                'assigned_manager_user_id' => $user->id,
            ] : null,
            'manager_sk_document' => $this->managerSkDocument($user),
        ];
    }

    /**
     * @return array<int, array{id: int, nik: string|null, nama_koperasi: string|null, provinsi: string|null, kota_kabupaten: string|null, kecamatan: string|null, desa: string|null, assigned_manager_user_id: int|null}>
     */
    private function kdkmpOptions(): array
    {
        return SdmKdkmpEntry::query()
            ->with('managerUser:id,sdm_kdkmp_entry_id')
            ->orderBy('nama_koperasi')
            ->get([
                'id',
                'nik',
                'nama_koperasi',
                'provinsi',
                'kota_kabupaten',
                'kecamatan',
                'desa',
            ])
            ->map(fn (SdmKdkmpEntry $entry): array => [
                'id' => $entry->id,
                'nik' => $entry->nik,
                'nama_koperasi' => $entry->nama_koperasi,
                'provinsi' => $entry->provinsi,
                'kota_kabupaten' => $entry->kota_kabupaten,
                'kecamatan' => $entry->kecamatan,
                'desa' => $entry->desa,
                'assigned_manager_user_id' => $entry->managerUser?->id,
            ])
            ->all();
    }

    /**
     * @return array{name: string, size: int, preview_url: string}|null
     */
    private function managerSkDocument(User $user): ?array
    {
        $document = $user->manager_sk_document;

        if (
            ! $user->isKdkmpManager()
            || ! is_array($document)
            || ! isset($document['original_name'], $document['size'])
        ) {
            return null;
        }

        return [
            'name' => (string) $document['original_name'],
            'size' => (int) $document['size'],
            'preview_url' => route('users.manager-sk-document.preview', $user, absolute: false),
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

    private function ensureUserBelongsToDomain(User $user, RoleDomain $domain): void
    {
        $user->loadMissing('role');

        abort_unless($user->role?->domain === $domain, 404);
    }
}
