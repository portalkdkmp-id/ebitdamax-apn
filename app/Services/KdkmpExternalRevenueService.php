<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KdkmpExternalRevenueService
{
    private const TOKEN_CACHE_KEY = 'kdkmp-external-access-token';

    private const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

    private const PERIOD = 'weekly';

    private const LIMIT = 10;

    private const PAGE = 1;

    /**
     * @return array{status: 'ok'|'error', revenue: float|null, message: string|null, fetched_at: string|null}
     */
    public function revenueFor(string $companyId, CarbonImmutable $startDate, CarbonImmutable $endDate): array
    {
        $baseUrl = rtrim((string) config('services.kdkmp_external.base_url'), '/');
        $clientKey = (string) config('services.kdkmp_external.client_key');
        $clientSecret = (string) config('services.kdkmp_external.client_secret');
        $cacheStore = (string) config('services.kdkmp_external.cache_store', 'redis');
        $cacheTtl = max(0, (int) config('services.kdkmp_external.cache_ttl', 300));

        if ($baseUrl === '' || $clientKey === '' || $clientSecret === '') {
            return $this->errorResult('Integrasi POS KDKMP belum dikonfigurasi.');
        }

        $cacheKey = sprintf(
            'kdkmp-pos-revenue:%s:%s:%s',
            $companyId,
            $startDate->toDateString(),
            $endDate->toDateString(),
        );
        $store = Cache::store($cacheStore);
        $cached = $store->get($cacheKey);

        if (is_array($cached)) {
            return $cached;
        }

        $result = $this->fetchRevenue(
            $baseUrl,
            $clientKey,
            $clientSecret,
            $cacheStore,
            $companyId,
            $startDate,
            $endDate,
        );

        if ($result['status'] === 'ok') {
            $store->put($cacheKey, $result, $cacheTtl);
        }

        return $result;
    }

    /**
     * @return array{status: 'ok'|'error', revenue: float|null, message: string|null, fetched_at: string|null}
     */
    private function fetchRevenue(
        string $baseUrl,
        string $clientKey,
        string $clientSecret,
        string $cacheStore,
        string $companyId,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
    ): array {
        $token = $this->accessToken($baseUrl, $clientKey, $clientSecret, $cacheStore);

        if ($token === null) {
            return $this->errorResult('Gagal memperoleh access token POS KDKMP.');
        }

        $response = $this->revenueRequest($baseUrl, $token, $clientKey, $companyId, $startDate, $endDate);

        if ($response?->status() === 401) {
            Cache::store($cacheStore)->forget(self::TOKEN_CACHE_KEY);
            $token = $this->accessToken($baseUrl, $clientKey, $clientSecret, $cacheStore);

            if ($token !== null) {
                $response = $this->revenueRequest($baseUrl, $token, $clientKey, $companyId, $startDate, $endDate);
            }
        }

        if ($response === null || ! $response->successful()) {
            Log::warning('Kdkmp POS revenue: failed to fetch revenue', [
                'status' => $response?->status(),
                'company_id' => $companyId,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ]);

            return $this->errorResult('Gagal mengambil data pendapatan POS dari sistem KDKMP.');
        }

        $rows = $response->json('payload.data');

        if (! is_array($rows)) {
            Log::warning('Kdkmp POS revenue: unexpected payload shape', [
                'company_id' => $companyId,
            ]);

            return $this->errorResult('Format respons pendapatan POS tidak dikenali.');
        }

        $revenue = 0.0;

        foreach ($rows as $row) {
            $value = is_array($row) ? ($row['totalRevenue'] ?? null) : null;

            if (is_numeric($value)) {
                $revenue += (float) $value;
            }
        }

        return [
            'status' => 'ok',
            'revenue' => round($revenue, 2),
            'message' => null,
            'fetched_at' => now()->toIso8601String(),
        ];
    }

    private function accessToken(
        string $baseUrl,
        string $clientKey,
        string $clientSecret,
        string $cacheStore,
    ): ?string {
        $cached = Cache::store($cacheStore)->get(self::TOKEN_CACHE_KEY);

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        try {
            $response = Http::timeout(10)
                ->connectTimeout(5)
                ->acceptJson()
                ->withHeaders(['X-CLIENT-KEY' => $clientKey])
                ->post($baseUrl.'/api/v1/access-token', [
                    'grantType' => 'client_credentials',
                    'clientSecret' => $clientSecret,
                ]);
        } catch (\Throwable $e) {
            Log::error('Kdkmp POS revenue: failed to request access token', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }

        if (! $response->successful()) {
            Log::warning('Kdkmp POS revenue: access token rejected', [
                'status' => $response->status(),
            ]);

            return null;
        }

        $token = $response->json('accessToken');
        $expiresIn = (int) $response->json('expiresIn', 3600);

        if (! is_string($token) || $token === '') {
            Log::warning('Kdkmp POS revenue: access token missing in response');

            return null;
        }

        Cache::store($cacheStore)->put(
            self::TOKEN_CACHE_KEY,
            $token,
            max(60, $expiresIn - self::TOKEN_EXPIRY_BUFFER_SECONDS),
        );

        return $token;
    }

    private function revenueRequest(
        string $baseUrl,
        string $token,
        string $clientKey,
        string $companyId,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
    ): ?Response {
        try {
            return Http::timeout(10)
                ->connectTimeout(5)
                ->acceptJson()
                ->withToken($token)
                ->withHeaders(['X-PARTNER-ID' => $clientKey])
                ->get($baseUrl.'/api/v1/revenue', [
                    'period' => self::PERIOD,
                    'limit' => self::LIMIT,
                    'page' => self::PAGE,
                    'companyId' => $companyId,
                    'startDate' => $startDate->toDateString(),
                    'endDate' => $endDate->toDateString(),
                ]);
        } catch (\Throwable $e) {
            Log::error('Kdkmp POS revenue: failed to fetch revenue', [
                'message' => $e->getMessage(),
                'company_id' => $companyId,
            ]);

            return null;
        }
    }

    /**
     * @return array{status: 'error', revenue: null, message: string, fetched_at: null}
     */
    private function errorResult(string $message): array
    {
        return [
            'status' => 'error',
            'revenue' => null,
            'message' => $message,
            'fetched_at' => null,
        ];
    }
}
