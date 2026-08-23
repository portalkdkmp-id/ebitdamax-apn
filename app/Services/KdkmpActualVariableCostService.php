<?php

namespace App\Services;

use App\Enums\TaskReportStatus;
use App\Models\TaskReportValue;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class KdkmpActualVariableCostService
{
    private const EXPENSE_TASK_NAME = 'Pencatatan Pengeluaran Operasional Harian';

    /** @var array<string, int> */
    private const FIELD_THRESHOLDS = [
        'token_listrik' => 3_000_000,
        'bahan_bakar_kendaraan' => 2_000_000,
    ];

    public function forUser(int $userId, CarbonImmutable $businessDate): string
    {
        $valuesByField = $this->expenseValuesFor($userId, $businessDate)
            ->groupBy('field_name');
        $totalActualVariableCost = 0.0;

        foreach (self::FIELD_THRESHOLDS as $fieldName => $threshold) {
            $fieldTotal = $valuesByField
                ->get($fieldName, collect())
                ->sum(fn (TaskReportValue $value): float => $this->numericValue($value->value) ?? 0.0);

            $totalActualVariableCost += max(0, $fieldTotal - $threshold);
        }

        return $this->formatNumber($totalActualVariableCost);
    }

    /**
     * @return Collection<int, TaskReportValue>
     */
    private function expenseValuesFor(int $userId, CarbonImmutable $businessDate): Collection
    {
        return TaskReportValue::query()
            ->join('task_reports', 'task_reports.id', '=', 'task_report_values.task_report_id')
            ->join('tasks', 'tasks.id', '=', 'task_reports.task_id')
            ->join(
                'task_additional_fields',
                'task_additional_fields.id',
                '=',
                'task_report_values.task_additional_field_id'
            )
            ->where('task_reports.user_id', $userId)
            ->where('task_reports.status', TaskReportStatus::Completed->value)
            ->whereBetween('task_reports.finished_at', [
                $businessDate->subDays(29)->startOfDay()->utc(),
                $businessDate->endOfDay()->utc(),
            ])
            ->where('tasks.name', self::EXPENSE_TASK_NAME)
            ->whereIn('task_additional_fields.field_name', array_keys(self::FIELD_THRESHOLDS))
            ->get([
                'task_report_values.id',
                'task_report_values.value',
                'task_additional_fields.field_name',
            ]);
    }

    private function numericValue(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $normalized = preg_replace('/\s+/u', '', trim($value));
        $normalized = preg_replace('/^rp\.?/i', '', (string) $normalized);

        if ($normalized === '' || preg_match('/^[+-]?\d+(?:[.,]\d+)*$/', $normalized) !== 1) {
            return null;
        }

        $lastDot = strrpos($normalized, '.');
        $lastComma = strrpos($normalized, ',');

        if ($lastDot !== false && $lastComma !== false) {
            if ($lastComma > $lastDot) {
                $normalized = str_replace('.', '', $normalized);
                $normalized = str_replace(',', '.', $normalized);
            } else {
                $normalized = str_replace(',', '', $normalized);
            }
        } elseif ($lastDot !== false) {
            $normalized = $this->normalizeSingleSeparator($normalized, '.');
        } elseif ($lastComma !== false) {
            $normalized = $this->normalizeSingleSeparator($normalized, ',');
        }

        return is_numeric($normalized) ? (float) $normalized : null;
    }

    private function normalizeSingleSeparator(string $value, string $separator): string
    {
        $separatorCount = substr_count($value, $separator);
        $decimalLength = strlen($value) - (int) strrpos($value, $separator) - 1;

        if ($separatorCount > 1 || $decimalLength === 3) {
            return str_replace($separator, '', $value);
        }

        return $separator === ',' ? str_replace(',', '.', $value) : $value;
    }

    private function formatNumber(float $value): string
    {
        return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
    }
}
