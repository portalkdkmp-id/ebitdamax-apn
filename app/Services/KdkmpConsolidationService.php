<?php

namespace App\Services;

use App\Models\EbitdamaxKdkmp;
use App\Models\SdmKdkmpEntry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class KdkmpConsolidationService
{
    /**
     * @param  Builder<SdmKdkmpEntry>  $kdkmpEntries
     * @return array<int, array{key: string, label: string, provinsi: string|null, kota_kabupaten: string|null, kecamatan: string|null, desa: string|null, total_kdkmp: int, complete_kdkmp: int, plan_revenue: float|null, actual_revenue: float|null, gap: float|null}>
     */
    public function forEntries(
        Builder $kdkmpEntries,
        string $reportDate,
        string $level,
    ): array {
        return $kdkmpEntries
            ->with([
                'dailyEbitdaRecords' => function (HasMany $query) use ($reportDate): void {
                    $query->whereDate('report_date', $reportDate);
                },
            ])
            ->get([
                'id',
                'provinsi',
                'kota_kabupaten',
                'kecamatan',
                'desa',
            ])
            ->groupBy(fn (SdmKdkmpEntry $entry): string => $this->groupKey($entry, $level))
            ->map(function (Collection $entries) use ($level): array {
                /** @var SdmKdkmpEntry $firstEntry */
                $firstEntry = $entries->first();
                $dailyRecords = $entries
                    ->flatMap(fn (SdmKdkmpEntry $entry): Collection => $entry->dailyEbitdaRecords);
                $planRevenue = $this->sumNumericValues($dailyRecords, 'plan_revenue');
                $actualRevenue = $this->sumNumericValues($dailyRecords, 'actual_revenue');

                return [
                    'key' => $this->groupKey($firstEntry, $level),
                    'label' => $this->groupLabel($firstEntry, $level),
                    'provinsi' => $firstEntry->provinsi,
                    'kota_kabupaten' => $firstEntry->kota_kabupaten,
                    'kecamatan' => $firstEntry->kecamatan,
                    'desa' => $firstEntry->desa,
                    'total_kdkmp' => $entries->count(),
                    'complete_kdkmp' => $dailyRecords->count(),
                    'plan_revenue' => $planRevenue,
                    'actual_revenue' => $actualRevenue,
                    'gap' => $planRevenue !== null && $actualRevenue !== null
                        ? round($actualRevenue - $planRevenue, 2)
                        : null,
                ];
            })
            ->sortBy('label', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }

    private function groupKey(SdmKdkmpEntry $entry, string $level): string
    {
        return match ($level) {
            'province' => (string) $entry->provinsi,
            'regency' => implode('|', [
                $entry->provinsi,
                $entry->kota_kabupaten,
            ]),
            'district' => implode('|', [
                $entry->provinsi,
                $entry->kota_kabupaten,
                $entry->kecamatan,
            ]),
            'village' => implode('|', [
                $entry->provinsi,
                $entry->kota_kabupaten,
                $entry->kecamatan,
                $entry->desa,
            ]),
            default => 'national',
        };
    }

    private function groupLabel(SdmKdkmpEntry $entry, string $level): string
    {
        return match ($level) {
            'province' => (string) ($entry->provinsi ?? '-'),
            'regency' => (string) ($entry->kota_kabupaten ?? '-'),
            'district' => (string) ($entry->kecamatan ?? '-'),
            'village' => (string) ($entry->desa ?? '-'),
            default => 'Indonesia',
        };
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
