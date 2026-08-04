<?php

namespace App\Services;

use App\Models\EbitdamaxKdkmp;
use App\Models\Role;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class KdkmpRevenueAnalyticsService
{
    private const TREND_DAYS = 30;

    /**
     * @param  array{provinsi?: string|null, kota_kabupaten?: string|null, kecamatan?: string|null, desa?: string|null}  $regionFilters
     * @return array{start_date: string, end_date: string, points: array<int, array{date: string, plan_revenue: float|null, actual_revenue: float|null, gap: float|null}>}
     */
    public function forAllKdkmp(CarbonImmutable $endDate, array $regionFilters = []): array
    {
        $startDate = $endDate->subDays(self::TREND_DAYS - 1)->startOfDay();
        $recordsByDate = EbitdamaxKdkmp::query()
            ->whereBetween('report_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->whereHas('sdmKdkmpEntry', function (Builder $query) use ($regionFilters): void {
                $query
                    ->forRegions($regionFilters)
                    ->whereHas('managerUser.role', function (Builder $query): void {
                        $query->where('slug', Role::SLUG_KDKMP_MANAGER);
                    });
            })
            ->oldest('report_date')
            ->get([
                'id',
                'sdm_kdkmp_entry_id',
                'report_date',
                'plan_revenue',
                'actual_revenue',
            ])
            ->groupBy(
                fn (EbitdamaxKdkmp $record): string => $record->report_date->toDateString()
            );

        $points = collect(range(0, self::TREND_DAYS - 1))
            ->map(function (int $offset) use ($recordsByDate, $startDate): array {
                $date = $startDate->addDays($offset)->toDateString();
                $dailyRecords = $recordsByDate->get($date, collect());
                $planRevenue = $this->sumNumericValues($dailyRecords, 'plan_revenue');
                $actualRevenue = $this->sumNumericValues($dailyRecords, 'actual_revenue');

                return [
                    'date' => $date,
                    'plan_revenue' => $planRevenue,
                    'actual_revenue' => $actualRevenue,
                    'gap' => $planRevenue !== null && $actualRevenue !== null
                        ? round($actualRevenue - $planRevenue, 2)
                        : null,
                ];
            })
            ->all();

        return [
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'points' => $points,
        ];
    }

    /**
     * @param  Collection<int, EbitdamaxKdkmp>  $records
     */
    private function sumNumericValues(Collection $records, string $field): ?float
    {
        $values = $records
            ->map(fn (EbitdamaxKdkmp $record): ?float => $this->numericValue($record->getAttribute($field)))
            ->filter(fn (?float $value): bool => $value !== null);

        if ($values->isEmpty()) {
            return null;
        }

        return round($values->sum(), 2);
    }

    private function numericValue(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (! is_string($value) || trim($value) === '' || ! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }
}
