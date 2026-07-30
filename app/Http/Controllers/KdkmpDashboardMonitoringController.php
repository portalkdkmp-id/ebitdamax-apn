<?php

namespace App\Http\Controllers;

use App\Http\Requests\MonitorEbitdamaxKdkmpRequest;
use App\Models\Role;
use App\Models\SdmKdkmpEntry;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class KdkmpDashboardMonitoringController extends Controller
{
    public function __invoke(MonitorEbitdamaxKdkmpRequest $request): Response
    {
        $today = CarbonImmutable::now((string) config('app.kdkmp_business_timezone'));
        $reportDate = (string) ($request->validated('date') ?? $today->toDateString());
        $search = trim((string) ($request->validated('search') ?? ''));
        $status = (string) ($request->validated('status') ?? 'all');

        $baseQuery = $this->managerKdkmpQuery();
        $total = (clone $baseQuery)->count();
        $filled = (clone $baseQuery)
            ->whereHas('dailyEbitdaRecords', function (Builder $query) use ($reportDate): void {
                $this->forDate($query, $reportDate);
            })
            ->count();
        $complete = (clone $baseQuery)
            ->whereHas('dailyEbitdaRecords', function (Builder $query) use ($reportDate): void {
                $this->completeForDate($query, $reportDate);
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
                    $this->completeForDate($recordQuery, $reportDate);
                });
            })
            ->when($status === 'draft', function (Builder $query) use ($reportDate): void {
                $query->whereHas('dailyEbitdaRecords', function (Builder $recordQuery) use ($reportDate): void {
                    $this->draftForDate($recordQuery, $reportDate);
                });
            })
            ->when($status === 'not_filled', function (Builder $query) use ($reportDate): void {
                $query->whereDoesntHave('dailyEbitdaRecords', function (Builder $recordQuery) use ($reportDate): void {
                    $this->forDate($recordQuery, $reportDate);
                });
            })
            ->orderBy('nama_koperasi')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (SdmKdkmpEntry $entry): array => $this->transformEntry($entry));

        return Inertia::render('KdkmpDashboard/Monitoring', [
            'entries' => $entries,
            'summary' => [
                'total' => $total,
                'complete' => $complete,
                'draft' => $filled - $complete,
                'not_filled' => $total - $filled,
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

    private function completeForDate(Builder $query, string $reportDate): void
    {
        $this->forDate($query, $reportDate);
        $query
            ->whereNotNull('target_revenue')
            ->whereNotNull('actual_revenue')
            ->whereNotNull('cost')
            ->whereNotNull('total_duration_minutes')
            ->whereNotNull('performance_score');
    }

    private function draftForDate(Builder $query, string $reportDate): void
    {
        $this->forDate($query, $reportDate);
        $query->where(function (Builder $draftQuery): void {
            $draftQuery
                ->whereNull('target_revenue')
                ->orWhereNull('actual_revenue')
                ->orWhereNull('cost')
                ->orWhereNull('total_duration_minutes')
                ->orWhereNull('performance_score');
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function transformEntry(SdmKdkmpEntry $entry): array
    {
        $dailyEntry = $entry->dailyEbitdaRecords->first();

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
            'daily_entry' => $dailyEntry ? [
                'target_revenue' => $dailyEntry->target_revenue !== null ? (float) $dailyEntry->target_revenue : null,
                'actual_revenue' => $dailyEntry->actual_revenue !== null ? (float) $dailyEntry->actual_revenue : null,
                'cost' => $dailyEntry->cost !== null ? (float) $dailyEntry->cost : null,
                'total_duration_minutes' => $dailyEntry->total_duration_minutes,
                'performance_score' => $dailyEntry->performance_score !== null ? (float) $dailyEntry->performance_score : null,
                'is_complete' => $dailyEntry->isComplete(),
                'updated_at' => $dailyEntry->updated_at?->toIso8601String(),
            ] : null,
        ];
    }
}
