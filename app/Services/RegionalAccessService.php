<?php

namespace App\Services;

use App\Enums\RoleDomain;
use App\Enums\RoleLevel;
use App\Models\Role;
use App\Models\SdmKdkmpEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class RegionalAccessService
{
    /**
     * @return Builder<SdmKdkmpEntry>
     */
    public function managedKdkmpQuery(): Builder
    {
        return SdmKdkmpEntry::query()
            ->whereHas('managerUser.role', function (Builder $query): void {
                $query
                    ->where('domain', RoleDomain::Kdkmp->value)
                    ->where('slug', Role::SLUG_KDKMP_MANAGER);
            });
    }

    /**
     * @param  array{provinsi?: string|null, kota_kabupaten?: string|null, kecamatan?: string|null, desa?: string|null}  $filters
     * @return Builder<SdmKdkmpEntry>
     */
    public function accessibleManagedKdkmpQuery(User $user, array $filters = []): Builder
    {
        return $this->managedKdkmpQuery()
            ->accessibleBy($user)
            ->forRegions($filters);
    }

    /**
     * @return array<int, array{provinsi: string, kota_kabupaten: string, kecamatan: string, desa: string}>
     */
    public function regionOptions(User $user): array
    {
        return $this->regionOptionsForQuery(
            $this->accessibleManagedKdkmpQuery($user),
        );
    }

    /**
     * @return array<int, array{provinsi: string, kota_kabupaten: string, kecamatan: string, desa: string}>
     */
    public function allRegionOptions(): array
    {
        return $this->regionOptionsForQuery($this->managedKdkmpQuery());
    }

    /**
     * @return array{is_national: bool, scope_label: string, locked_filters: array{provinsi: string|null, kota_kabupaten: string|null, kecamatan: string|null, desa: string|null}}
     */
    public function filterContext(User $user): array
    {
        if ($user->role?->level === RoleLevel::Superadmin) {
            return [
                'is_national' => true,
                'scope_label' => 'Nasional',
                'locked_filters' => [
                    'provinsi' => null,
                    'kota_kabupaten' => null,
                    'kecamatan' => null,
                    'desa' => null,
                ],
            ];
        }

        $options = $this->regionOptions($user);
        $lockedFilters = [];

        foreach (SdmKdkmpEntry::REGION_FIELDS as $field) {
            $values = collect($options)
                ->pluck($field)
                ->filter(fn (string $value): bool => $value !== '')
                ->unique()
                ->values();

            $lockedFilters[$field] = $values->count() === 1
                ? $values->first()
                : null;
        }

        $assignmentCount = $user->regionalAssignments()->count();
        $scopeLabel = $assignmentCount > 1
            ? "{$assignmentCount} cakupan wilayah"
            : ($user->sdm_kdkmp_entry_id !== null ? 'KDKMP sendiri' : 'Wilayah penugasan');

        return [
            'is_national' => false,
            'scope_label' => $scopeLabel,
            'locked_filters' => [
                'provinsi' => $lockedFilters['provinsi'],
                'kota_kabupaten' => $lockedFilters['kota_kabupaten'],
                'kecamatan' => $lockedFilters['kecamatan'],
                'desa' => $lockedFilters['desa'],
            ],
        ];
    }

    /**
     * @param  Builder<SdmKdkmpEntry>  $query
     * @return array<int, array{provinsi: string, kota_kabupaten: string, kecamatan: string, desa: string}>
     */
    private function regionOptionsForQuery(Builder $query): array
    {
        foreach (SdmKdkmpEntry::REGION_FIELDS as $field) {
            $query
                ->whereNotNull($field)
                ->where($field, '<>', '')
                ->orderBy($field);
        }

        return $query
            ->select(SdmKdkmpEntry::REGION_FIELDS)
            ->distinct()
            ->get()
            ->map(fn (SdmKdkmpEntry $entry): array => [
                'provinsi' => (string) $entry->provinsi,
                'kota_kabupaten' => (string) $entry->kota_kabupaten,
                'kecamatan' => (string) $entry->kecamatan,
                'desa' => (string) $entry->desa,
            ])
            ->all();
    }
}
