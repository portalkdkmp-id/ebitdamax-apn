<?php

namespace App\Observers;

use App\Services\KdkmpMonitoringCacheService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Database\Eloquent\Model;

class InvalidateKdkmpMonitoringCache implements ShouldHandleEventsAfterCommit
{
    public function __construct(
        private readonly KdkmpMonitoringCacheService $cache,
    ) {}

    public function saved(Model $model): void
    {
        $this->cache->invalidate();
    }

    public function deleted(Model $model): void
    {
        $this->cache->invalidate();
    }
}
