<?php

namespace Database\Seeders;

use App\Enums\RoleDomain;
use App\Enums\RoleLevel;
use App\Models\Role;
use App\Models\SdmKdkmpEntry;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class SdmKdkmpManagerUserSeeder extends Seeder
{
    public function run(): void
    {
        $managerRole = Role::query()
            ->where('slug', Role::SLUG_KDKMP_MANAGER)
            ->where('level', RoleLevel::Manager->value)
            ->where('domain', RoleDomain::Kdkmp->value)
            ->first();

        if (! $managerRole) {
            throw new RuntimeException('Role Kepala Toko / Manager tidak ditemukan.');
        }

        $entries = SdmKdkmpEntry::query()
            ->orderBy('id')
            ->get(['id', 'nik', 'nama_koperasi']);

        if ($entries->isEmpty()) {
            $this->command?->warn('Tidak ada data SDM KDKMP yang dapat dibuatkan akun.');

            return;
        }

        $invalidEntries = $entries->filter(
            fn (SdmKdkmpEntry $entry): bool => trim((string) $entry->nik) === ''
                || trim((string) $entry->nama_koperasi) === '',
        );

        if ($invalidEntries->isNotEmpty()) {
            throw new RuntimeException(
                "{$invalidEntries->count()} data SDM tidak memiliki NIK atau nama koperasi."
            );
        }

        $usersByEntryId = User::query()
            ->whereIn('sdm_kdkmp_entry_id', $entries->pluck('id'))
            ->get()
            ->keyBy('sdm_kdkmp_entry_id');
        $usersByEmail = User::query()
            ->whereIn('email', $entries->map(
                fn (SdmKdkmpEntry $entry): string => $this->emailFor($entry->nik),
            ))
            ->get()
            ->keyBy('email');
        $conflicts = $this->conflicts(
            $entries,
            $managerRole,
            $usersByEntryId,
            $usersByEmail,
        );

        if ($conflicts->isNotEmpty()) {
            throw new RuntimeException(
                'Sinkronisasi dibatalkan untuk mencegah data akun ganda atau perubahan role yang tidak disengaja: '
                .$conflicts->take(10)->implode(' | ')
            );
        }

        $initialPassword = config('auth.kdkmp_manager_initial_password');

        if (! is_string($initialPassword) || mb_strlen($initialPassword) < 8) {
            throw new RuntimeException(
                'KDKMP_MANAGER_INITIAL_PASSWORD wajib diisi dengan minimal 8 karakter sebelum menjalankan seeder.'
            );
        }

        $existingCount = $usersByEntryId->count();
        $newCount = $entries->count() - $existingCount;
        $takenUsernames = User::query()
            ->whereNotNull('username')
            ->pluck('username')
            ->flip()
            ->map(fn (): bool => true)
            ->all();
        $timestamp = now();
        $initialPasswordHash = Hash::make($initialPassword);
        $records = $entries->map(
            function (SdmKdkmpEntry $entry) use (
                $initialPasswordHash,
                $managerRole,
                $timestamp,
                $usersByEntryId,
                &$takenUsernames,
            ): array {
                $existingUser = $usersByEntryId->get($entry->id);
                $username = $existingUser instanceof User && filled($existingUser->username)
                    ? $existingUser->username
                    : $this->nextUsername($entry->nama_koperasi, $takenUsernames);

                return [
                    'role_id' => $managerRole->id,
                    'sdm_kdkmp_entry_id' => $entry->id,
                    'name' => $entry->nama_koperasi,
                    'username' => $username,
                    'email' => $this->emailFor($entry->nik),
                    'email_verified_at' => $timestamp,
                    'password' => $initialPasswordHash,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            },
        );

        DB::transaction(function () use ($records): void {
            $records->chunk(500)->each(function (Collection $chunk): void {
                User::query()->upsert(
                    values: $chunk->all(),
                    uniqueBy: ['sdm_kdkmp_entry_id'],
                    update: [
                        'role_id',
                        'name',
                        'username',
                        'email',
                        'updated_at',
                    ],
                );
            });
        });

        $this->command?->info(
            "KDKMP manager users selesai: {$newCount} dibuat, {$existingCount} diperbarui."
        );
    }

    /**
     * @param  Collection<int, SdmKdkmpEntry>  $entries
     * @param  Collection<int, User>  $usersByEntryId
     * @param  Collection<string, User>  $usersByEmail
     * @return Collection<int, string>
     */
    private function conflicts(
        Collection $entries,
        Role $managerRole,
        Collection $usersByEntryId,
        Collection $usersByEmail,
    ): Collection {
        return $entries
            ->map(function (SdmKdkmpEntry $entry) use ($managerRole, $usersByEntryId, $usersByEmail): ?string {
                $userForEntry = $usersByEntryId->get($entry->id);
                $email = $this->emailFor($entry->nik);
                $userForEmail = $usersByEmail->get($email);

                if ($userForEntry instanceof User && $userForEntry->role_id !== $managerRole->id) {
                    return "SDM {$entry->id} sudah terhubung ke akun non-Manager ({$userForEntry->email}).";
                }

                if (
                    $userForEmail instanceof User
                    && (! ($userForEntry instanceof User) || $userForEmail->id !== $userForEntry->id)
                ) {
                    return "Email {$email} sudah digunakan akun lain.";
                }

                return null;
            })
            ->filter()
            ->values();
    }

    private function emailFor(string $nik): string
    {
        $localPart = (string) Str::of($nik)
            ->lower()
            ->trim();

        if ($localPart === '' || ! preg_match('/^[a-z0-9._-]+$/', $localPart)) {
            throw new RuntimeException('NIK tidak dapat dikonversi menjadi email.');
        }

        return "{$localPart}@ebitdamax.local";
    }

    /**
     * @param  array<string, bool>  $takenUsernames
     */
    private function nextUsername(string $name, array &$takenUsernames): string
    {
        $baseUsername = Str::slug($name) ?: Str::random(8);
        $username = $baseUsername;
        $suffix = 2;

        while (isset($takenUsernames[$username])) {
            $username = $baseUsername.'-'.$suffix;
            $suffix++;
        }

        $takenUsernames[$username] = true;

        return $username;
    }
}
