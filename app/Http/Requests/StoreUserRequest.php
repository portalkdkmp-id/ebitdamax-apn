<?php

namespace App\Http\Requests;

use App\Enums\RegionalScopeLevel;
use App\Enums\RoleDomain;
use App\Models\Role;
use App\Models\SdmKdkmpEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'domain' => ['required', Rule::enum(RoleDomain::class)],
            'role_id' => [
                'required',
                Rule::exists('roles', 'id')->where('domain', $this->input('domain')),
            ],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'regional_assignments' => ['nullable', 'array', 'max:25'],
            'regional_assignments.*' => ['array'],
            'regional_assignments.*.scope_level' => [
                'required',
                Rule::in(RegionalScopeLevel::values()),
            ],
            'regional_assignments.*.provinsi' => ['required', 'string', 'max:255'],
            'regional_assignments.*.kota_kabupaten' => ['nullable', 'string', 'max:255'],
            'regional_assignments.*.kecamatan' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $this->validateRegionalAssignments($validator);
        }];
    }

    private function validateRegionalAssignments(Validator $validator): void
    {
        $assignmentKeys = [];
        $role = Role::query()->find($this->input('role_id'));
        $assignments = $this->input('regional_assignments', []);
        $hasRegionalAssignments = is_array($assignments) && $assignments !== [];
        $isRegionalManager = $role?->domain === RoleDomain::Kdkmp
            && $role?->slug === Role::SLUG_REGIONAL_MANAGER;
        $isEbitdaKdkmp = $role?->domain === RoleDomain::Kdkmp
            && $role?->slug === Role::SLUG_EBITDA_KDKMP;

        if (
            $isRegionalManager
            && (! is_array($assignments) || $assignments === [])
        ) {
            $validator->errors()->add(
                'regional_assignments',
                'Manager Wilayah wajib memiliki minimal satu cakupan wilayah.',
            );

            return;
        }

        if (
            $hasRegionalAssignments
            && ! $isRegionalManager
            && ! $isEbitdaKdkmp
        ) {
            $validator->errors()->add(
                'regional_assignments',
                'Cakupan wilayah hanya dapat diberikan kepada role Manager Wilayah atau KDKMP.',
            );

            return;
        }

        foreach ($assignments as $index => $assignment) {
            if (! is_array($assignment)) {
                continue;
            }

            $scopeLevel = $assignment['scope_level'] ?? null;
            $provinsi = $assignment['provinsi'] ?? null;
            $kotaKabupaten = $assignment['kota_kabupaten'] ?? null;
            $kecamatan = $assignment['kecamatan'] ?? null;

            if (! is_string($scopeLevel) || ! in_array($scopeLevel, RegionalScopeLevel::values(), true)) {
                continue;
            }

            if (
                $isEbitdaKdkmp
                && $scopeLevel === RegionalScopeLevel::Province->value
            ) {
                $validator->errors()->add(
                    "regional_assignments.{$index}.scope_level",
                    'Role KDKMP hanya dapat diberi cakupan Kabupaten/Kota atau Kecamatan.',
                );

                continue;
            }

            if (
                ($scopeLevel === RegionalScopeLevel::Regency->value || $scopeLevel === RegionalScopeLevel::District->value)
                && (! is_string($kotaKabupaten) || trim($kotaKabupaten) === '')
            ) {
                $validator->errors()->add(
                    "regional_assignments.{$index}.kota_kabupaten",
                    'Kabupaten/Kota wajib diisi untuk cakupan ini.',
                );

                continue;
            }

            if (
                $scopeLevel === RegionalScopeLevel::District->value
                && (! is_string($kecamatan) || trim($kecamatan) === '')
            ) {
                $validator->errors()->add(
                    "regional_assignments.{$index}.kecamatan",
                    'Kecamatan wajib diisi untuk cakupan kecamatan.',
                );

                continue;
            }

            if (! is_string($provinsi)) {
                continue;
            }

            $query = SdmKdkmpEntry::query()
                ->where('provinsi', $provinsi)
                ->whereHas('managerUser.role', function ($roleQuery): void {
                    $roleQuery
                        ->where('domain', RoleDomain::Kdkmp->value)
                        ->where('slug', Role::SLUG_KDKMP_MANAGER);
                });

            if ($scopeLevel !== RegionalScopeLevel::Province->value) {
                $query->where('kota_kabupaten', $kotaKabupaten);
            }

            if ($scopeLevel === RegionalScopeLevel::District->value) {
                $query->where('kecamatan', $kecamatan);
            }

            if (! $query->exists()) {
                $validator->errors()->add(
                    "regional_assignments.{$index}.provinsi",
                    'Cakupan wilayah tidak memiliki data KDKMP yang dapat dimonitor.',
                );
            }

            $assignmentKey = implode('|', [
                $scopeLevel,
                $provinsi,
                $kotaKabupaten,
                $kecamatan,
            ]);

            if (in_array($assignmentKey, $assignmentKeys, true)) {
                $validator->errors()->add(
                    "regional_assignments.{$index}.scope_level",
                    'Cakupan wilayah tersebut sudah ditambahkan.',
                );
            }

            $assignmentKeys[] = $assignmentKey;
        }
    }
}
