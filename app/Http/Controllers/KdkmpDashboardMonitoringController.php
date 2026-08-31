<?php

namespace App\Http\Controllers;

use App\Http\Requests\MonitorEbitdamaxKdkmpRequest;
use App\Models\EbitdamaxKdkmp;
use App\Models\SdmKdkmpEntry;
use App\Models\User;
use App\Services\KdkmpConsolidationService;
use App\Services\KdkmpDashboardMetricsService;
use App\Services\KdkmpMonthlyFinancialMatrixService;
use App\Services\RegionalAccessService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class KdkmpDashboardMonitoringController extends Controller
{
    public function __construct(
        private readonly KdkmpDashboardMetricsService $dashboardMetrics,
        private readonly KdkmpConsolidationService $consolidation,
        private readonly KdkmpMonthlyFinancialMatrixService $monthlyFinancialMatrix,
        private readonly RegionalAccessService $regionalAccess,
    ) {}

    public function __invoke(MonitorEbitdamaxKdkmpRequest $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $today = CarbonImmutable::now((string) config('app.kdkmp_business_timezone'))->startOfDay();
        $selectedMonth = $this->selectedMonth($request, $today);
        $periodStart = CarbonImmutable::createFromFormat(
            'Y-m',
            $selectedMonth,
            (string) config('app.kdkmp_business_timezone')
        )->startOfMonth();
        $periodEnd = $periodStart->isSameMonth($today)
            ? $today
            : $periodStart->endOfMonth();
        $search = trim((string) ($request->validated('search') ?? ''));
        $status = (string) ($request->validated('status') ?? 'all');
        $regionalAccess = $this->regionalAccess->filterContext($user);
        $regionFilters = $this->withLockedRegionFilters(
            $this->regionFilters($request),
            $regionalAccess['locked_filters'],
        );
        $consolidationLevel = (string) ($request->validated('consolidation_level') ?? 'national');

        if (! $regionalAccess['is_national'] && $consolidationLevel === 'national') {
            $consolidationLevel = 'province';
        }

        $baseQuery = $this->regionalAccess->accessibleManagedKdkmpQuery(
            $user,
            $regionFilters,
        );
        $selectedKdkmp = $regionFilters['desa'] !== null
            ? (clone $baseQuery)->first([
                'id',
                'nik',
                'nama_koperasi',
                'desa',
                'kecamatan',
                'kota_kabupaten',
                'provinsi',
            ])
            : null;
        $detailDate = $selectedKdkmp instanceof SdmKdkmpEntry
            ? $this->detailDate($request, $periodStart, $periodEnd)
            : null;
        $reportDate = $detailDate ?? $periodEnd->toDateString();
        $selectedBusinessDate = CarbonImmutable::createFromFormat(
            'Y-m-d',
            $reportDate,
            (string) config('app.kdkmp_business_timezone')
        )->startOfDay();
        $monthlyFinancialMatrix = $selectedKdkmp instanceof SdmKdkmpEntry
            ? $this->monthlyFinancialMatrix->forEntries(
                (clone $baseQuery)->whereKey($selectedKdkmp->id),
                $periodStart,
                $periodEnd,
            )
            : null;
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

        $entries = (clone $baseQuery)
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
        $consolidation = $this->consolidation->forEntries(
            clone $baseQuery,
            $reportDate,
            $consolidationLevel,
        );

        return Inertia::render('KdkmpDashboard/Monitoring', [
            'entries' => $entries,
            'summary' => [
                'total' => $total,
                'complete' => $filled,
                'not_filled' => $total - $filled,
                'requires_review' => $requiresReview,
            ],
            'filters' => [
                'month' => $periodStart->format('Y-m'),
                'detail_date' => $detailDate,
                'search' => $search,
                'status' => $status,
                'consolidation_level' => $consolidationLevel,
                ...$regionFilters,
            ],
            'regionOptions' => $this->regionalAccess->regionOptions($user),
            'regionalAccess' => $regionalAccess,
            'businessDate' => $today->toDateString(),
            'consolidation' => [
                'level' => $consolidationLevel,
                'rows' => $consolidation,
            ],
            'selectedKdkmp' => $selectedKdkmp instanceof SdmKdkmpEntry
                ? [
                    'id' => $selectedKdkmp->id,
                    'nik' => $selectedKdkmp->nik,
                    'name' => $selectedKdkmp->nama_koperasi,
                    'desa' => $selectedKdkmp->desa,
                    'kecamatan' => $selectedKdkmp->kecamatan,
                    'kota_kabupaten' => $selectedKdkmp->kota_kabupaten,
                    'provinsi' => $selectedKdkmp->provinsi,
                ]
                : null,
            'monthlyFinancialMatrix' => $monthlyFinancialMatrix,
        ]);
    }

    private function selectedMonth(
        MonitorEbitdamaxKdkmpRequest $request,
        CarbonImmutable $today,
    ): string {
        $month = $request->validated('month');

        if (is_string($month) && $month !== '') {
            return $month;
        }

        $legacyDate = $request->validated('date');

        if (is_string($legacyDate) && $legacyDate !== '') {
            return substr($legacyDate, 0, 7);
        }

        return $today->format('Y-m');
    }

    private function detailDate(
        MonitorEbitdamaxKdkmpRequest $request,
        CarbonImmutable $periodStart,
        CarbonImmutable $periodEnd,
    ): ?string {
        $detailDate = $request->validated('detail_date');

        if (! is_string($detailDate) || $detailDate === '') {
            return null;
        }

        $date = CarbonImmutable::createFromFormat(
            'Y-m-d',
            $detailDate,
            (string) config('app.kdkmp_business_timezone')
        )->startOfDay();

        if ($date->lt($periodStart) || $date->gt($periodEnd)) {
            return null;
        }

        return $date->toDateString();
    }

    /**
     * @return array{provinsi: string|null, kota_kabupaten: string|null, kecamatan: string|null, desa: string|null}
     */
    private function regionFilters(MonitorEbitdamaxKdkmpRequest $request): array
    {
        return [
            'provinsi' => $this->nullableString($request->validated('provinsi')),
            'kota_kabupaten' => $this->nullableString($request->validated('kota_kabupaten')),
            'kecamatan' => $this->nullableString($request->validated('kecamatan')),
            'desa' => $this->nullableString($request->validated('desa')),
        ];
    }

    /**
     * @param  array{provinsi: string|null, kota_kabupaten: string|null, kecamatan: string|null, desa: string|null}  $filters
     * @param  array{provinsi: string|null, kota_kabupaten: string|null, kecamatan: string|null, desa: string|null}  $lockedFilters
     * @return array{provinsi: string|null, kota_kabupaten: string|null, kecamatan: string|null, desa: string|null}
     */
    private function withLockedRegionFilters(array $filters, array $lockedFilters): array
    {
        foreach (SdmKdkmpEntry::REGION_FIELDS as $field) {
            if ($filters[$field] === null && $lockedFilters[$field] !== null) {
                $filters[$field] = $lockedFilters[$field];
            }
        }

        return $filters;
    }

    private function nullableString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
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
                if ($field === 'plan_cost') {
                    $dailyEntryData['variable_cost'] = $overrides['variable_cost']
                        ?? $dailyEntry->plan_cost;

                    continue;
                }

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
