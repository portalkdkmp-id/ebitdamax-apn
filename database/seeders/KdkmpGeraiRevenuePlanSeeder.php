<?php

namespace Database\Seeders;

use App\Models\RevenuePlan;
use App\Models\User;
use Illuminate\Database\Seeder;

class KdkmpGeraiRevenuePlanSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()
            ->where('email', User::EMAIL_KDKMP_GERAI)
            ->firstOrFail();

        $revenuePlan = RevenuePlan::query()->firstOrCreate(
            [
                'user_id' => $owner->id,
                'code' => RevenuePlan::CODE_KDKMP_GERAI,
            ],
            [
                'name' => 'RENCANA PENDAPATAN',
                'plan_date' => '2026-04-18',
                'rka_revenue_target' => null,
                'planned_production_quantity' => null,
                'days_per_month' => 30,
                'daily_rka_revenue_target' => null,
                'planned_total_daily_revenue' => 20000000,
                'source_sheet' => '3. RENCANA PENDAPATAN',
            ]
        );

        if (! $revenuePlan->wasRecentlyCreated) {
            return;
        }

        $rows = require database_path('seeders/data/kdkmp_gerai_revenue_plan.php');

        foreach ($rows as $row) {
            $revenuePlan->rows()->updateOrCreate(
                ['sort_order' => $row['sort_order']],
                $row
            );
        }
    }
}
