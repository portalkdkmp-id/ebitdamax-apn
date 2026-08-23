<?php

namespace App\Actions;

use App\Models\EbitdamaxKdkmp;
use App\Models\User;
use App\Services\KdkmpActualVariableCostService;
use Carbon\CarbonImmutable;

final class SyncKdkmpActualVariableCostAction
{
    public function __construct(
        private readonly KdkmpActualVariableCostService $actualVariableCost,
    ) {}

    public function handle(User $user, CarbonImmutable $businessDate): ?EbitdamaxKdkmp
    {
        if (! $user->isKdkmpManager() || $user->sdm_kdkmp_entry_id === null) {
            return null;
        }

        $entry = EbitdamaxKdkmp::query()->firstOrNew([
            'sdm_kdkmp_entry_id' => $user->sdm_kdkmp_entry_id,
            'report_date' => $businessDate->toDateString(),
        ]);
        $actualVariableCost = $this->actualVariableCost->forUser($user->id, $businessDate);

        if ($entry->exists && $entry->actual_variable_cost === $actualVariableCost) {
            return $entry;
        }

        if (! $entry->exists) {
            $entry->created_by = $user->id;
            $entry->target_revenue = EbitdamaxKdkmp::TARGET_REVENUE;
        }

        $entry->fill([
            'actual_variable_cost' => $actualVariableCost,
            'updated_by' => $user->id,
        ]);
        $entry->save();

        return $entry;
    }
}
