<?php

namespace App\Services;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class KdkmpMonitoringCacheService
{
    private const VERSION_KEY = 'kdkmp-monitoring:version';

    /**
     * @param  array<string, mixed>  $parameters
     */
    public function remember(
        User $user,
        string $segment,
        array $parameters,
        Closure $resolver,
    ): mixed {
        try {
            $cache = $this->store();
            $key = $this->key($cache, $user, $segment, $parameters);
            $missing = new \stdClass;
            $cached = $cache->get($key, $missing);

            if ($cached !== $missing) {
                return $cached;
            }
        } catch (Throwable $exception) {
            $this->logFailure($exception);

            return $resolver();
        }

        $value = $resolver();

        try {
            $cache->put($key, $value, now()->addSeconds($this->ttl()));
        } catch (Throwable $exception) {
            $this->logFailure($exception);
        }

        return $value;
    }

    public function invalidate(): void
    {
        try {
            $this->store()->increment(self::VERSION_KEY);
        } catch (Throwable $exception) {
            $this->logFailure($exception);
        }
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    private function key(
        Repository $cache,
        User $user,
        string $segment,
        array $parameters,
    ): string {
        $scopeHash = $this->scopeHash($user);
        $parametersHash = hash(
            'sha256',
            json_encode($parameters, JSON_THROW_ON_ERROR),
        );

        return implode(':', [
            'kdkmp-monitoring',
            'v1',
            $this->version($cache),
            $user->id,
            $scopeHash,
            $segment,
            $parametersHash,
        ]);
    }

    private function store(): Repository
    {
        return Cache::store('redis');
    }

    private function ttl(): int
    {
        return max(60, (int) config('cache.kdkmp_monitoring_ttl_seconds', 300));
    }

    private function version(Repository $cache): int
    {
        $version = $cache->get(self::VERSION_KEY);

        if (! is_numeric($version) || (int) $version < 1) {
            $cache->add(self::VERSION_KEY, 1);
            $version = $cache->get(self::VERSION_KEY, 1);
        }

        return is_numeric($version) && (int) $version > 0
            ? (int) $version
            : 1;
    }

    private function scopeHash(User $user): string
    {
        $user->loadMissing([
            'role:id,level,domain,updated_at',
            'regionalAssignments:id,user_id,scope_level,provinsi,kota_kabupaten,kecamatan,updated_at',
        ]);

        return hash('sha256', json_encode([
            'user_updated_at' => $user->updated_at?->toIso8601String(),
            'role' => $user->role ? [
                'id' => $user->role->id,
                'level' => $user->role->level->value,
                'domain' => $user->role->domain->value,
                'updated_at' => $user->role->updated_at?->toIso8601String(),
            ] : null,
            'sdm_kdkmp_entry_id' => $user->sdm_kdkmp_entry_id,
            'regional_assignments' => $user->regionalAssignments
                ->sortBy('id')
                ->map(fn ($assignment): array => [
                    'scope_level' => $assignment->scope_level->value,
                    'provinsi' => $assignment->provinsi,
                    'kota_kabupaten' => $assignment->kota_kabupaten,
                    'kecamatan' => $assignment->kecamatan,
                    'updated_at' => $assignment->updated_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ], JSON_THROW_ON_ERROR));
    }

    private function logFailure(Throwable $exception): void
    {
        Log::warning(
            'Redis cache Monitoring KDKMP tidak tersedia. Data dimuat langsung dari database.',
            ['exception' => $exception],
        );
    }
}
