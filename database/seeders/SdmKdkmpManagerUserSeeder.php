<?php

namespace Database\Seeders;

use App\Enums\RoleLevel;
use App\Models\Role;
use App\Models\SdmKdkmpEntry;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class SdmKdkmpManagerUserSeeder extends Seeder
{
    private const USER_LIMIT = 100;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $initialPassword = config('auth.kdkmp_manager_initial_password');

        if (! is_string($initialPassword) || mb_strlen($initialPassword) < 8) {
            throw new RuntimeException(
                'KDKMP_MANAGER_INITIAL_PASSWORD wajib diisi dengan minimal 8 karakter sebelum menjalankan seeder.'
            );
        }

        $managerRole = Role::query()
            ->where('slug', Role::SLUG_KDKMP_MANAGER)
            ->where('level', RoleLevel::Manager->value)
            ->first();

        if (! $managerRole) {
            throw new RuntimeException('Role Kepala Toko / Manager tidak ditemukan.');
        }

        $entries = SdmKdkmpEntry::query()
            ->orderBy('id')
            ->limit(self::USER_LIMIT)
            ->get(['id', 'nik', 'nama_koperasi']);

        if ($entries->count() < self::USER_LIMIT) {
            throw new RuntimeException(
                'Data SDM KDKMP belum mencapai '.self::USER_LIMIT.' baris.'
            );
        }

        $createdUsers = 0;
        $updatedUsers = 0;

        DB::transaction(function () use (
            $entries,
            $managerRole,
            $initialPassword,
            &$createdUsers,
            &$updatedUsers
        ): void {
            foreach ($entries as $entry) {
                if (! $entry->nik || ! $entry->nama_koperasi) {
                    throw new RuntimeException("Data SDM KDKMP ID {$entry->id} tidak lengkap.");
                }

                $email = $this->emailFor($entry->nik);
                $user = User::query()->firstOrNew([
                    'sdm_kdkmp_entry_id' => $entry->id,
                ]);

                $emailAlreadyUsed = User::query()
                    ->where('email', $email)
                    ->when($user->exists, fn ($query) => $query->whereKeyNot($user->id))
                    ->exists();

                if ($emailAlreadyUsed) {
                    throw new RuntimeException("Email {$email} sudah digunakan user lain.");
                }

                if (! $user->exists) {
                    $user->password = $initialPassword;
                    $user->email_verified_at = now();
                    $createdUsers++;
                } else {
                    $updatedUsers++;
                }

                $user->fill([
                    'role_id' => $managerRole->id,
                    'name' => $entry->nama_koperasi,
                    'email' => $email,
                ]);
                $user->save();
            }
        });

        $this->command?->info(
            "KDKMP manager users selesai: {$createdUsers} dibuat, {$updatedUsers} diperbarui."
        );
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
}
