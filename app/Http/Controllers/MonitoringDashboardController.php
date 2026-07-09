<?php

namespace App\Http\Controllers;

use App\Services\MonitoringDashboardService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringDashboardController extends Controller
{
    public function __construct(
        private readonly MonitoringDashboardService $monitoringService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Monitoring/Index', $this->monitoringService->summary());
    }

    public function mapPoints(): JsonResponse
    {
        return response()
            ->json($this->monitoringService->mapPoints())
            ->header(
                'Cache-Control',
                'private, max-age='.MonitoringDashboardService::MAP_POINTS_CACHE_TTL_SECONDS,
            );
    }
}
