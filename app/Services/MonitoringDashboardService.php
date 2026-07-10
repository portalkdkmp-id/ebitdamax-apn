<?php

namespace App\Services;

use App\Models\KoperasiSarprasStatusPoint;
use App\Models\SdmKdkmpEntry;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MonitoringDashboardService
{
    private const CACHE_TTL_SECONDS = 600;

    public const MAP_POINTS_CACHE_TTL_SECONDS = 900;

    public function summary(): array
    {
        return [
            'sarpras' => $this->sarprasCompletionSummary(),
            'pemetaan_lahan' => $this->pemetaanLahanStats(),
            'sdm' => $this->sdmSummary(),
            'operasional_odoo' => $this->operasionalOdooSummary(),
            'stock' => $this->stockSummary(),
            'produk_subsidi' => $this->produkSubsidiSummary(),
        ];
    }

    /**
     * Placeholder stock summary. Replace with Odoo integration.
     *
     * @return array{
     *     jumlah_sku_terdaftar: int,
     *     jumlah_sku_aktif: int,
     *     jumlah_sku_subsidi: int,
     *     rata_rata_sku_per_kdkmp: int,
     *     min_sku_kdkmp: int,
     *     max_sku_kdkmp: int,
     *     total_kdkmp: int,
     *     distribusi_per_kdkmp: array<int, array{kdkmp_id: int, nama: string, sku_count: int}>
     * }
     */
    public function stockSummary(): array
    {
        $totalKdkmp = 1112;
        $jumlahSkuTerdaftar = 1080;
        $jumlahSkuAktif = 521;
        $jumlahSkuSubsidi = 38;
        $avg = 155;
        $min = 1;
        $max = 325;

        $distribution = $this->buildDummySkuDistribution(
            totalKdkmp: $totalKdkmp,
            avg: $avg,
            min: $min,
            max: $max,
        );

        return [
            'jumlah_sku_terdaftar' => $jumlahSkuTerdaftar,
            'jumlah_sku_aktif' => $jumlahSkuAktif,
            'jumlah_sku_subsidi' => $jumlahSkuSubsidi,
            'rata_rata_sku_per_kdkmp' => $avg,
            'min_sku_kdkmp' => $min,
            'max_sku_kdkmp' => $max,
            'total_kdkmp' => $totalKdkmp,
            'distribusi_per_kdkmp' => $distribution,
        ];
    }

    /**
     * Placeholder produk subsidi summary. Replace with Odoo integration.
     *
     * @return array{availability: array{gerai: float, kabupaten: float, provinsi: float, nasional: float}}
     */
    public function produkSubsidiSummary(): array
    {
        return [
            'availability' => [
                'gerai' => 72.4,
                'kabupaten' => 80.1,
                'provinsi' => 85.6,
                'nasional' => 89.2,
            ],
        ];
    }

    /**
     * Bangun distribusi dummy per KDKMP untuk grafik sebaran.
     * Sumbu diurut naik, MIN tepat di slot pertama, MAX di slot terakhir,
     * slot di antaranya menurun dari MAX ke MIN mendekati rata-rata.
     *
     * @return array<int, array{kdkmp_id: int, nama: string, sku_count: int}>
     */
    private function buildDummySkuDistribution(int $totalKdkmp, int $avg, int $min, int $max): array
    {
        $result = [];
        $midpoint = intdiv($totalKdkmp, 2);

        for ($i = 0; $i < $totalKdkmp; $i++) {
            $rank = $i / max(1, $totalKdkmp - 1);
            // Lerp dari MAX ke MIN dengan sedikit noise sehingga nilai tengah
            // mendekati rata-rata ($avg).
            $lerp = $max + ($min - $max) * $rank;
            $noise = ($i % 7) - 3;
            $value = (int) round($lerp + $noise);

            if ($i === 0) {
                $value = $min;
            } elseif ($i === $totalKdkmp - 1) {
                $value = $max;
            } elseif ($i === $midpoint) {
                $value = $avg;
            }

            $value = max($min, min($max, $value));

            $result[] = [
                'kdkmp_id' => $i + 1,
                'nama' => 'KDKMP-'.str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
                'sku_count' => $value,
            ];
        }

        usort($result, fn (array $a, array $b): int => $a['sku_count'] <=> $b['sku_count']);

        // Re-id setelah sort supaya urutan visual naik konsisten dengan id.
        foreach ($result as $index => &$row) {
            $row['kdkmp_id'] = $index + 1;
        }

        return $result;
    }

    /**
     * @return array{status: 'ok'|'error', data: array|null, fetched_at: string|null}
     */
    public function sarprasCompletionSummary(): array
    {
        return $this->fetchExternal(
            cacheKey: 'monitoring:sarpras-completion-summary',
            url: rtrim(config('services.portal_pembangunan.base_url'), '/').'/api/laporan-vendor/sarpras-completion-summary',
            token: config('services.portal_pembangunan.sarpras_token'),
        );
    }

    /**
     * @return array{status: 'ok'|'error', data: array|null, fetched_at: string|null}
     */
    public function pemetaanLahanStats(): array
    {
        return $this->fetchExternal(
            cacheKey: 'monitoring:pemetaan-lahan-stats',
            url: rtrim(config('services.portal_pemetaan.base_url'), '/').'/api/validasi-lahan/get-stats',
        );
    }

    public function sdmSummary(): array
    {
        return [
            'jumlah_kdkmp_ditambahkan' => SdmKdkmpEntry::query()->where('jumlah_karyawan', '>', 0)->count(),
            'total_karyawan' => (int) SdmKdkmpEntry::query()->sum('jumlah_karyawan'),
        ];
    }

    /**
     * @return array{total_kdkmp: int, kdkmp_sudah_dibuatkan_po: int, kdkmp_sudah_penerimaan_barang: int, kdkmp_sudah_penjualan: int, updated_at: string|null}
     */
    public function operasionalOdooSummary(): array
    {
        $lastUpdatedPoint = KoperasiSarprasStatusPoint::query()
            ->where(function ($query): void {
                $query
                    ->where('has_po', true)
                    ->orWhere('has_receipt', true)
                    ->orWhere('has_sales', true);
            })
            ->latest('updated_at')
            ->first();

        return [
            'total_kdkmp' => $this->distinctKdkmpCount(),
            'kdkmp_sudah_dibuatkan_po' => $this->distinctKdkmpCount('has_po'),
            'kdkmp_sudah_penerimaan_barang' => $this->distinctKdkmpCount('has_receipt'),
            'kdkmp_sudah_penjualan' => $this->distinctKdkmpCount('has_sales'),
            'updated_at' => $lastUpdatedPoint?->updated_at?->toIso8601String(),
        ];
    }

    private function distinctKdkmpCount(?string $flagColumn = null): int
    {
        $query = KoperasiSarprasStatusPoint::query()
            ->whereNotNull('nik')
            ->where('nik', '<>', '');

        if ($flagColumn !== null) {
            $query->where($flagColumn, true);
        }

        return $query->distinct()->count('nik');
    }

    /**
     * Urutan tetap, dipakai untuk mengonversi marker_tier/marker_color ke
     * index numerik pada payload biner. Harus selaras dengan ATLAS_TIERS
     * dan ATLAS_COLORS di resources/js/components/monitoring/KoperasiMap.tsx.
     */
    private const MARKER_TIERS = ['status', 'sarpras', 'sdm', 'odoo'];

    private const MARKER_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'gray'];

    /**
     * Bitmask kolom boolean pada payload biner. Harus selaras dengan
     * FLAG di resources/js/components/monitoring/KoperasiMap.tsx.
     */
    private const FLAG_SARPRAS_PRIMARY = 1;

    private const FLAG_SARPRAS_SECONDARY = 2;

    private const FLAG_SARPRAS_LENGKAP = 4;

    private const FLAG_HAS_PO = 8;

    private const FLAG_HAS_RECEIPT = 16;

    private const FLAG_HAS_SALES = 32;

    /**
     * Metadata titik peta (JSON) - field string dan tabel lookup provinsi/
     * kota-kabupaten/kecamatan/status verifikasi. Field numerik/enum ada di
     * mapPointsBinary() sebagai payload biner terpisah supaya tidak
     * melewati JSON.parse untuk data yang dominan angka.
     *
     * @return array{status: 'ok'|'error', fetched_at: string|null, count: int, tables: array, nik: array, nama: array, kodim: array}
     */
    public function mapPointsMeta(): array
    {
        $payload = $this->buildMapPointsPayload();
        unset($payload['binary']);

        return $payload;
    }

    /**
     * Payload biner titik peta pemetaan lahan: lat/lng dan seluruh field
     * numerik/enum di-pack jadi typed array per kolom (structure-of-arrays),
     * bukan dikirim sebagai teks JSON, supaya lebih ringkas dan tidak perlu
     * JSON.parse untuk ~36 ribu titik. Urutan blok byte:
     * lat(f32) lng(f32) | provinsiIdx(u16) kotaKabupatenIdx(u16)
     * kecamatanIdx(u16) jumlahKaryawan(u16) | validationStatusIdx(u8)
     * progress(u8) completedSarprasCount(u8) flags(u8) tierIdx(u8)
     * colorIdx(u8). Harus selaras dengan decodeMapPointsBinary() di
     * resources/js/components/monitoring/KoperasiMap.tsx.
     */
    public function mapPointsBinary(): string
    {
        return $this->buildMapPointsPayload()['binary'];
    }

    /**
     * Titik peta pemetaan lahan, satu titik per pengajuan lahan terverifikasi.
     * Setiap titik diprioritaskan ke tahap paling lanjut yang sudah dicapai:
     * Odoo (PO/GR/penjualan) > SDM > sarpras > status verifikasi/pembangunan.
     *
     * @return array{status: 'ok'|'error', fetched_at: string|null, count: int, tables: array, nik: array, nama: array, kodim: array, binary: string}
     */
    private function buildMapPointsPayload(): array
    {
        $latestSyncRaw = KoperasiSarprasStatusPoint::query()->max('synced_at');

        if (! $latestSyncRaw) {
            return [
                'status' => 'error',
                'fetched_at' => null,
                'count' => 0,
                'tables' => ['provinsi' => [], 'kotaKabupaten' => [], 'kecamatan' => [], 'validationStatus' => []],
                'nik' => [],
                'nama' => [],
                'kodim' => [],
                'binary' => '',
            ];
        }

        $latestSync = Carbon::parse($latestSyncRaw)->toIso8601String();
        $latestPointUpdateRaw = KoperasiSarprasStatusPoint::query()->max('updated_at');
        $latestPointUpdate = $latestPointUpdateRaw
            ? Carbon::parse($latestPointUpdateRaw)->toIso8601String()
            : $latestSync;
        $cacheKey = 'monitoring:koperasi-sarpras-status-points-binary:'.$latestSync.':'.$latestPointUpdate;

        return Cache::remember($cacheKey, self::MAP_POINTS_CACHE_TTL_SECONDS, function () use ($latestSync): array {
            $sdmByNik = SdmKdkmpEntry::query()->pluck('jumlah_karyawan', 'nik');

            $provinsiTable = [];
            $provinsiLookup = [];
            $kotaKabupatenTable = [];
            $kotaKabupatenLookup = [];
            $kecamatanTable = [];
            $kecamatanLookup = [];
            $validationStatusTable = [];
            $validationStatusLookup = [];

            $lat = [];
            $lng = [];
            $provinsiIdx = [];
            $kotaKabupatenIdx = [];
            $kecamatanIdx = [];
            $jumlahKaryawan = [];
            $validationStatusIdx = [];
            $progress = [];
            $completedSarprasCount = [];
            $flags = [];
            $tierIdx = [];
            $colorIdx = [];
            $nik = [];
            $nama = [];
            $kodim = [];

            foreach (KoperasiSarprasStatusPoint::query()->cursor() as $point) {
                $nikValue = $point->nik;
                $progressValue = $point->progress_percentage;
                $jumlahKaryawanValue = $nikValue ? (int) ($sdmByNik[$nikValue] ?? 0) : 0;

                [$tier, $color] = $this->resolveMarker($point, $progressValue, $jumlahKaryawanValue);

                $lat[] = (float) $point->lat;
                $lng[] = (float) $point->lng;
                $provinsiIdx[] = $this->internString($provinsiTable, $provinsiLookup, $point->provinsi);
                $kotaKabupatenIdx[] = $this->internString($kotaKabupatenTable, $kotaKabupatenLookup, $point->kota_kabupaten);
                $kecamatanIdx[] = $this->internString($kecamatanTable, $kecamatanLookup, $point->kecamatan);
                $jumlahKaryawan[] = $jumlahKaryawanValue;
                $validationStatusIdx[] = $this->internString($validationStatusTable, $validationStatusLookup, $point->validation_status);
                $progress[] = (int) round($progressValue);
                $completedSarprasCount[] = (int) $point->completed_sarpras_count;

                $flagByte = 0;
                $flagByte |= $point->sarpras_primary_lengkap ? self::FLAG_SARPRAS_PRIMARY : 0;
                $flagByte |= $point->sarpras_secondary_lengkap ? self::FLAG_SARPRAS_SECONDARY : 0;
                $flagByte |= $point->sarpras_lengkap ? self::FLAG_SARPRAS_LENGKAP : 0;
                $flagByte |= $point->has_po ? self::FLAG_HAS_PO : 0;
                $flagByte |= $point->has_receipt ? self::FLAG_HAS_RECEIPT : 0;
                $flagByte |= $point->has_sales ? self::FLAG_HAS_SALES : 0;
                $flags[] = $flagByte;

                $tierIdx[] = array_search($tier, self::MARKER_TIERS, true);
                $colorIdx[] = array_search($color, self::MARKER_COLORS, true);

                $nik[] = $nikValue;
                $nama[] = $point->nama_koperasi;
                $kodim[] = $point->kodim;
            }

            $binary =
                pack('g*', ...$lat).
                pack('g*', ...$lng).
                pack('v*', ...$provinsiIdx).
                pack('v*', ...$kotaKabupatenIdx).
                pack('v*', ...$kecamatanIdx).
                pack('v*', ...$jumlahKaryawan).
                pack('C*', ...$validationStatusIdx).
                pack('C*', ...$progress).
                pack('C*', ...$completedSarprasCount).
                pack('C*', ...$flags).
                pack('C*', ...$tierIdx).
                pack('C*', ...$colorIdx);

            return [
                'status' => 'ok',
                'fetched_at' => $latestSync,
                'count' => count($lat),
                'tables' => [
                    'provinsi' => $provinsiTable,
                    'kotaKabupaten' => $kotaKabupatenTable,
                    'kecamatan' => $kecamatanTable,
                    'validationStatus' => $validationStatusTable,
                ],
                'nik' => $nik,
                'nama' => $nama,
                'kodim' => $kodim,
                'binary' => $binary,
            ];
        });
    }

    /**
     * Mendaftarkan $value ke $table bila belum ada, mengembalikan index-nya.
     * $lookup adalah peta value => index untuk pencarian O(1), supaya proses
     * dedup ~36 ribu baris tidak jadi O(n^2).
     *
     * @param  array<int, string>  $table
     * @param  array<string, int>  $lookup
     */
    private function internString(array &$table, array &$lookup, ?string $value): int
    {
        $value ??= '';

        if (isset($lookup[$value])) {
            return $lookup[$value];
        }

        $index = count($table);
        $table[] = $value;
        $lookup[$value] = $index;

        return $index;
    }

    /**
     * @return array{0: 'status'|'sarpras'|'sdm'|'odoo', 1: 'red'|'orange'|'yellow'|'green'|'blue'|'gray'}
     */
    private function resolveMarker(KoperasiSarprasStatusPoint $point, float $progress, int $jumlahKaryawan): array
    {
        // Tier 3: sudah ada progres Odoo (PO/GR/penjualan), prioritas tertinggi.
        if ($point->has_po || $point->has_receipt || $point->has_sales) {
            $color = match (true) {
                $point->has_sales => 'blue',
                $point->has_receipt => 'green',
                default => 'yellow',
            };

            return ['odoo', $color];
        }

        // Tier 2: sarpras sudah lengkap semua, fokus berpindah ke SDM.
        // Tiga warna: belum ada (merah), sebagian (kuning), 6 orang lengkap (hijau).
        if ($point->sarpras_lengkap) {
            $color = match (true) {
                $jumlahKaryawan >= 6 => 'green',
                $jumlahKaryawan > 0 => 'yellow',
                default => 'red',
            };

            return ['sdm', $color];
        }

        // Tier 1: pembangunan 100%, fokus jadi kelengkapan sarpras
        if ($progress >= 100) {
            $color = match (true) {
                $point->sarpras_secondary_lengkap => 'green',
                $point->sarpras_primary_lengkap => 'yellow',
                default => 'red',
            };

            return ['sarpras', $color];
        }

        // Tier 0: status verifikasi/pembangunan
        $status = $point->validation_status;

        return match (true) {
            $status === 'Sedang Diverifikasi' => ['status', 'yellow'],
            $status === 'Dipertimbangkan' => ['status', 'orange'],
            $status === 'Terverifikasi' && $progress > 0 => ['status', 'green'],
            $status === 'Terverifikasi' => ['status', 'red'],
            default => ['status', 'gray'],
        };
    }

    /**
     * @return array{status: 'ok'|'error', data: array|null, fetched_at: string|null}
     */
    private function fetchExternal(string $cacheKey, string $url, ?string $token = null): array
    {
        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($url, $token): array {
            try {
                $request = Http::timeout(10);

                if ($token) {
                    $request = $request->withToken($token);
                }

                $response = $request->get($url);

                if (! $response->successful()) {
                    Log::warning("Monitoring dashboard: non-200 from {$url}", ['status' => $response->status()]);

                    return ['status' => 'error', 'data' => null, 'fetched_at' => null];
                }

                return [
                    'status' => 'ok',
                    'data' => $response->json(),
                    'fetched_at' => now()->toIso8601String(),
                ];
            } catch (\Throwable $e) {
                Log::error("Monitoring dashboard: failed to fetch {$url}: {$e->getMessage()}");

                return ['status' => 'error', 'data' => null, 'fetched_at' => null];
            }
        });
    }
}
