<?php

namespace App\Http\Controllers;

use App\Http\Requests\MonitorEbitdamaxKdkmpRequest;
use App\Models\EbitdamaxKdkmp;
use App\Models\Role;
use App\Models\SdmKdkmpEntry;
use App\Services\KdkmpDashboardMetricsService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class KdkmpDashboardMonitoringController extends Controller
{
    public function __construct(
        private readonly KdkmpDashboardMetricsService $dashboardMetrics,
    ) {}

    public function __invoke(MonitorEbitdamaxKdkmpRequest $request): Response
    {
        $today = CarbonImmutable::now((string) config('app.kdkmp_business_timezone'));
        $reportDate = (string) ($request->validated('date') ?? $today->toDateString());
        $search = trim((string) ($request->validated('search') ?? ''));
        $status = (string) ($request->validated('status') ?? 'all');
        $selectedBusinessDate = CarbonImmutable::createFromFormat(
            'Y-m-d',
            $reportDate,
            (string) config('app.kdkmp_business_timezone')
        )->startOfDay();

        $baseQuery = $this->managerKdkmpQuery();
        $total = (clone $baseQuery)->count();
        $filled = (clone $baseQuery)
            ->whereHas('dailyEbitdaRecords', function (Builder $query) use ($reportDate): void {
                $this->forDate($query, $reportDate);
            })
            ->count();
        $requiresReview = (clone $baseQuery)
            ->whereHas('dailyEbitdaRecords', function (Builder $query) use ($reportDate): void {
                $this->forDate($query, $reportDate);
                $query->where('plan_revenue_requires_review', true);
            })
            ->count();

        $entries = $this->managerKdkmpQuery()
            ->with([
                'managerUser:id,sdm_kdkmp_entry_id,name,email,username',
                'dailyEbitdaRecords' => function ($query) use ($reportDate): void {
                    $query->whereDate('report_date', $reportDate);
                },
            ])
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $subQuery) use ($search): void {
                    $subQuery
                        ->where('nama_koperasi', 'ilike', "%{$search}%")
                        ->orWhere('nik', 'ilike', "%{$search}%")
                        ->orWhere('desa', 'ilike', "%{$search}%")
                        ->orWhere('kecamatan', 'ilike', "%{$search}%")
                        ->orWhere('kota_kabupaten', 'ilike', "%{$search}%")
                        ->orWhere('provinsi', 'ilike', "%{$search}%")
                        ->orWhereHas('managerUser', function (Builder $managerQuery) use ($search): void {
                            $managerQuery
                                ->where('name', 'ilike', "%{$search}%")
                                ->orWhere('email', 'ilike', "%{$search}%");
                        });
                });
            })
            ->when($status === 'complete', function (Builder $query) use ($reportDate): void {
                $query->whereHas('dailyEbitdaRecords', function (Builder $recordQuery) use ($reportDate): void {
                    $this->forDate($recordQuery, $reportDate);
                });
            })
            ->when($status === 'not_filled', function (Builder $query) use ($reportDate): void {
                $query->whereDoesntHave('dailyEbitdaRecords', function (Builder $recordQuery) use ($reportDate): void {
                    $this->forDate($recordQuery, $reportDate);
                });
            })
            ->when($status === 'requires_review', function (Builder $query) use ($reportDate): void {
                $query->whereHas('dailyEbitdaRecords', function (Builder $recordQuery) use ($reportDate): void {
                    $this->forDate($recordQuery, $reportDate);
                    $recordQuery->where('plan_revenue_requires_review', true);
                });
            })
            ->orderBy('nama_koperasi')
            ->paginate(25)
            ->withQueryString();

        $metricsByUser = $this->dashboardMetrics->forUsers(
            $entries->getCollection()
                ->map(fn (SdmKdkmpEntry $entry): ?int => $entry->managerUser?->id)
                ->filter(),
            $selectedBusinessDate
        );

        $entries->through(function (SdmKdkmpEntry $entry) use ($metricsByUser): array {
            $managerUserId = $entry->managerUser?->id;
            $metrics = $managerUserId !== null
                ? $metricsByUser->get($managerUserId, [])
                : [];

            return $this->transformEntry($entry, [
                'target_revenue' => EbitdamaxKdkmp::TARGET_REVENUE,
                ...$metrics,
            ]);
        });

        return Inertia::render('KdkmpDashboard/Monitoring', [
            'entries' => $entries,
            'summary' => [
                'total' => $total,
                'complete' => $filled,
                'not_filled' => $total - $filled,
                'requires_review' => $requiresReview,
            ],
            'filters' => [
                'date' => $reportDate,
                'search' => $search,
                'status' => $status,
            ],
            'businessDate' => $today->toDateString(),
        ]);
    }

    private function managerKdkmpQuery(): Builder
    {
        return SdmKdkmpEntry::query()
            ->whereHas('managerUser.role', function (Builder $query): void {
                $query->where('slug', Role::SLUG_KDKMP_MANAGER);
            });
    }

    private function forDate(Builder $query, string $reportDate): void
    {
        $query->whereDate('report_date', $reportDate);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformEntry(SdmKdkmpEntry $entry, array $overrides = []): array
    {
        $dailyEntry = $entry->dailyEbitdaRecords->first();

        $dailyEntryData = null;

        if ($dailyEntry) {
            $dailyEntryData = [
                'is_complete' => $dailyEntry->isComplete(),
                'plan_revenue_requires_review' => $dailyEntry->plan_revenue_requires_review,
                'updated_at' => $dailyEntry->updated_at?->toIso8601String(),
            ];

            foreach (EbitdamaxKdkmp::ACTIVE_FIELDS as $field) {
                $dailyEntryData[$field] = $overrides[$field] ?? $dailyEntry->getAttribute($field);
            }

            $dailyEntryData['actual_ebitda_margin'] = EbitdamaxKdkmp::calculateActualEbitdaMargin(
                is_string($dailyEntryData['actual_revenue']) ? $dailyEntryData['actual_revenue'] : null
            );
            $dailyEntryData['performance_scoring'] = EbitdamaxKdkmp::calculatePerformanceScoring(
                is_string($dailyEntryData['plan_revenue']) ? $dailyEntryData['plan_revenue'] : null,
                is_string($dailyEntryData['actual_revenue']) ? $dailyEntryData['actual_revenue'] : null,
                (float) ($overrides['task_completion_rate'] ?? 0),
                (float) ($overrides['time_compliance_rate'] ?? 0),
            );
        }

        return [
            'id' => $entry->id,
            'nik' => $entry->nik,
            'name' => $entry->nama_koperasi,
            'desa' => $entry->desa,
            'kecamatan' => $entry->kecamatan,
            'kota_kabupaten' => $entry->kota_kabupaten,
            'provinsi' => $entry->provinsi,
            'manager' => $entry->managerUser ? [
                'name' => $entry->managerUser->name,
                'email' => $entry->managerUser->email,
                'username' => $entry->managerUser->username,
            ] : null,
            'metrics' => [
                'task_completion_rate' => (float) ($overrides['task_completion_rate'] ?? 0),
            ],
            'daily_entry' => $dailyEntryData,
        ];
    }
}
