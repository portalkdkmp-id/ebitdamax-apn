<?php

namespace App\Console\Commands;

use App\Models\KoperasiSarprasStatusPoint;
use App\Models\SdmKdkmpEntry;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

#[Signature('sync:sdm-kdkmp-from-sarpras {--dry-run : Tampilkan ringkasan tanpa mengubah data SDM KDKMP.}')]
#[Description('Sinkronkan KDKMP dengan Sarpras Esensial 1 lengkap ke data SDM berdasarkan NIK.')]
class SyncSdmKdkmpFromSarprasCommand extends Command
{
    private const CHUNK_SIZE = 500;

    public function handle(): int
    {
        $points = KoperasiSarprasStatusPoint::query()
            ->where('sarpras_primary_lengkap', true)
            ->whereNotNull('nik')
            ->where('nik', '!=', '')
            ->orderByDesc('synced_at')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get([
                'nik',
                'nama_koperasi',
                'provinsi',
                'kota_kabupaten',
                'kecamatan',
                'desa',
                'kodim',
                'batch',
            ])
            ->unique('nik')
            ->values();

        if ($points->isEmpty()) {
            $this->warn('Tidak ada data Sarpras Esensial 1 lengkap yang dapat disinkronkan.');

            return self::SUCCESS;
        }

        $invalidPoints = $points->filter(
            fn (KoperasiSarprasStatusPoint $point): bool => trim((string) $point->nama_koperasi) === '',
        );

        if ($invalidPoints->isNotEmpty()) {
            $this->error("Sinkronisasi dibatalkan: {$invalidPoints->count()} data sumber tidak memiliki nama koperasi.");

            return self::FAILURE;
        }

        $niks = $points->pluck('nik');
        $existingCount = SdmKdkmpEntry::query()
            ->whereIn('nik', $niks)
            ->count();
        $newCount = $points->count() - $existingCount;

        $this->table(
            ['Sumber unik', 'Diperbarui', 'Ditambahkan', 'Total SDM setelah sinkronisasi'],
            [[
                $points->count(),
                $existingCount,
                $newCount,
                SdmKdkmpEntry::query()->count() + $newCount,
            ]],
        );

        if ($this->option('dry-run')) {
            $this->info('Dry run selesai. Tidak ada data yang diubah.');

            return self::SUCCESS;
        }

        $timestamp = now();
        $records = $points->map(
            fn (KoperasiSarprasStatusPoint $point): array => [
                'nik' => $point->nik,
                'nama_koperasi' => $point->nama_koperasi,
                'provinsi' => $point->provinsi,
                'nama_kodim' => $point->kodim,
                'desa' => $point->desa,
                'kecamatan' => $point->kecamatan,
                'kota_kabupaten' => $point->kota_kabupaten,
                'batch' => $point->batch,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        );

        $records->chunk(self::CHUNK_SIZE)->each(
            function (Collection $chunk): void {
                SdmKdkmpEntry::query()->upsert(
                    values: $chunk->all(),
                    uniqueBy: ['nik'],
                    update: [
                        'nama_koperasi',
                        'provinsi',
                        'nama_kodim',
                        'desa',
                        'kecamatan',
                        'kota_kabupaten',
                        'batch',
                        'updated_at',
                    ],
                );
            },
        );

        $this->info("Sinkronisasi selesai: {$existingCount} data diperbarui dan {$newCount} data ditambahkan.");

        return self::SUCCESS;
    }
}
