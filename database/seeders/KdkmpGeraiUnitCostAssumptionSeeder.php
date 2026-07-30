<?php

namespace Database\Seeders;

use App\Models\UnitCostAssumption;
use App\Models\User;
use Illuminate\Database\Seeder;

class KdkmpGeraiUnitCostAssumptionSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()
            ->where('email', User::EMAIL_KDKMP_GERAI)
            ->firstOrFail();

        $assumption = UnitCostAssumption::query()->firstOrCreate(
            [
                'user_id' => $owner->id,
                'code' => UnitCostAssumption::CODE_KDKMP_GERAI,
            ],
            [
                'name' => 'UNIT COST PER-HARI & PER-JAM',
                'assumption_date' => '2026-04-18',
                'days_per_year' => 365,
                'days_per_month' => 30,
                'work_hours_per_day' => 8,
                'source_sheet' => '2. UNIT COST ASSUMPTION',
            ]
        );

        if (! $assumption->wasRecentlyCreated) {
            return;
        }

        $rows = require database_path('seeders/data/kdkmp_gerai_unit_cost_assumption.php');

        foreach ($rows as $row) {
            $assumption->rows()->updateOrCreate(
                ['sort_order' => $row['sort_order']],
                $row
            );
        }
    }
}
