<?php

namespace App\Services;

use App\Models\SdmKdkmpEntry;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MonitoringDashboardService
{
    private const CACHE_TTL_SECONDS = 600;

    public function summary(): array
    {
        return [
            'sarpras' => $this->sarprasCompletionSummary(),
            'pemetaan_lahan' => $this->pemetaanLahanStats(),
            'sdm' => $this->sdmSummary(),
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
     * @return array{status: 'ok'|'error', data: array|null, fetched_at: string|null}
     */
    private function fetchExternal(string $cacheKey, string $url): array
    {
        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($url): array {
            try {
                $response = Http::timeout(10)->get($url);

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
