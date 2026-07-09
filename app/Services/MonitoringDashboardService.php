<?php

namespace App\Services;

use App\Models\KdkmpOperationalEntry;
use App\Models\KoperasiSarprasStatusPoint;
use App\Models\SdmKdkmpEntry;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
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
     * @return array{stock_berputar: int, active_sku: int, jumlah_sku: int}
     */
    public function stockSummary(): array
    {
        return [
            'stock_berputar' => 12450,
            'active_sku' => 482,
            'jumlah_sku' => 615,
        ];
    }

    /**
     * Placeholder produk subsidi summary. Replace with Odoo integration.
     *
     * @return array{total_sku_subsidi: int, availability: array{gerai: float, kabupaten: float, provinsi: float, nasional: float}}
     */
    public function produkSubsidiSummary(): array
    {
        return [
            'total_sku_subsidi' => 38,
            'availability' => [
                'gerai' => 72.4,
                'kabupaten' => 80.1,
                'provinsi' => 85.6,
                'nasional' => 89.2,
            ],
        ];
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
        $lastImportedEntry = KdkmpOperationalEntry::query()
            ->whereNotNull('imported_at')
            ->latest('imported_at')
            ->first();

        return [
            'total_kdkmp' => KdkmpOperationalEntry::query()->count(),
            'kdkmp_sudah_dibuatkan_po' => KdkmpOperationalEntry::query()->where('has_po', true)->count(),
            'kdkmp_sudah_penerimaan_barang' => KdkmpOperationalEntry::query()->where('has_receipt', true)->count(),
            'kdkmp_sudah_penjualan' => KdkmpOperationalEntry::query()->where('has_sales', true)->count(),
            'updated_at' => $lastImportedEntry?->imported_at?->toIso8601String(),
        ];
    }

    /**
     * Urutan tuple `points` yang dikembalikan mapPoints(). Harus selaras dengan
     * MapPointTuple di resources/js/types/monitoring.ts.
     */
    public const MAP_POINT_FIELDS = [
        'nik', 'nama_koperasi', 'provinsi', 'kota_kabupaten', 'kecamatan', 'kodim',
        'lat', 'lng', 'validation_status', 'progress_percentage', 'completed_sarpras_count',
        'sarpras_primary_lengkap', 'sarpras_secondary_lengkap', 'sarpras_lengkap',
        'jumlah_karyawan', 'has_po', 'has_receipt', 'has_sales', 'marker_tier', 'marker_color',
    ];

    /**
     * Titik peta pemetaan lahan, satu titik per pengajuan lahan terverifikasi.
     * Setiap titik diprioritaskan ke tahap paling lanjut yang sudah dicapai:
     * Odoo (PO/GR/penjualan) > SDM > sarpras > status verifikasi/pembangunan.
     *
     * `points` adalah array tuple posisional (lihat MAP_POINT_FIELDS), bukan
     * object berkey, agar payload untuk sekitar 35 ribu titik tidak membengkak
     * akibat pengulangan nama field.
     *
     * @return array{status: 'ok'|'error', points: array, fetched_at: string|null}
     */
    public function mapPoints(): array
    {
        $latestSyncRaw = KoperasiSarprasStatusPoint::query()->max('synced_at');

        if (! $latestSyncRaw) {
            return ['status' => 'error', 'points' => [], 'fetched_at' => null];
        }

        $latestSync = Carbon::parse($latestSyncRaw)->toIso8601String();
        $cacheKey = 'monitoring:koperasi-sarpras-status-points:'.$latestSync;

        return Cache::remember($cacheKey, self::MAP_POINTS_CACHE_TTL_SECONDS, function () use ($latestSync): array {
            $sdmByNik = SdmKdkmpEntry::query()->pluck('jumlah_karyawan', 'nik');

            $odooByNik = KdkmpOperationalEntry::query()
                ->get(['nik', 'has_po', 'has_receipt', 'has_sales'])
                ->keyBy('nik');

            $points = KoperasiSarprasStatusPoint::query()
                ->cursor()
                ->map(fn (KoperasiSarprasStatusPoint $point): array => $this->buildMapPoint($point, $sdmByNik, $odooByNik))
                ->all();

            return [
                'status' => 'ok',
                'points' => $points,
                'fetched_at' => $latestSync,
            ];
        });
    }

    /**
     * Dikembalikan sebagai tuple posisional (bukan object berkey) agar payload
     * untuk sekitar 35 ribu titik tidak membengkak akibat pengulangan nama
     * field. Urutan elemen harus selaras dengan MAP_POINT_FIELDS dan tipe
     * MapPointTuple di resources/js/types/monitoring.ts.
     *
     * @param  array<string, int>  $sdmByNik
     * @param  Collection<string, KdkmpOperationalEntry>  $odooByNik
     * @return array<string, mixed>
     */
    private function buildMapPoint(KoperasiSarprasStatusPoint $point, $sdmByNik, $odooByNik): array
    {
        $nik = $point->nik;
        $progress = $point->progress_percentage;
        $jumlahKaryawan = $nik ? (int) ($sdmByNik[$nik] ?? 0) : 0;
        $odoo = $nik ? $odooByNik->get($nik) : null;

        [$tier, $color] = $this->resolveMarker($point, $progress, $jumlahKaryawan, $odoo);

        return [
            $nik,
            $point->nama_koperasi,
            $point->provinsi,
            $point->kota_kabupaten,
            $point->kecamatan,
            $point->kodim,
            $point->lat,
            $point->lng,
            $point->validation_status,
            $progress,
            $point->completed_sarpras_count,
            $point->sarpras_primary_lengkap,
            $point->sarpras_secondary_lengkap,
            $point->sarpras_lengkap,
            $jumlahKaryawan,
            (bool) ($odoo?->has_po ?? false),
            (bool) ($odoo?->has_receipt ?? false),
            (bool) ($odoo?->has_sales ?? false),
            $tier,
            $color,
        ];
    }

    /**
     * @return array{0: 'status'|'sarpras'|'sdm'|'odoo', 1: 'red'|'orange'|'yellow'|'green'|'blue'|'gray'}
     */
    private function resolveMarker(KoperasiSarprasStatusPoint $point, float $progress, int $jumlahKaryawan, ?KdkmpOperationalEntry $odoo): array
    {
        // Tier 3: sudah ada progres Odoo (PO/GR/penjualan), prioritas tertinggi.
        if ($odoo && ($odoo->has_po || $odoo->has_receipt || $odoo->has_sales)) {
            $color = match (true) {
                $odoo->has_sales => 'blue',
                $odoo->has_receipt => 'green',
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
