<?php

namespace Database\Seeders;

use App\Models\BusinessProcess;
use App\Models\PlanEbitdaMatrix;
use App\Models\RevenuePlan;
use App\Models\UnitCostAssumption;
use App\Models\User;
use Illuminate\Database\Seeder;

class KdkmpGeraiPlanEbitdaMatrixSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()->where('email', User::EMAIL_KDKMP_GERAI)->firstOrFail();
        $businessProcess = BusinessProcess::query()
            ->with('steps')
            ->whereBelongsTo($owner)
            ->where('code', BusinessProcess::CODE_KDKMP_GERAI)
            ->firstOrFail();
        $unitCostAssumption = UnitCostAssumption::query()
            ->whereBelongsTo($owner)
            ->where('code', UnitCostAssumption::CODE_KDKMP_GERAI)
            ->firstOrFail();
        $revenuePlan = RevenuePlan::query()
            ->whereBelongsTo($owner)
            ->where('code', RevenuePlan::CODE_KDKMP_GERAI)
            ->firstOrFail();

        $matrix = PlanEbitdaMatrix::query()->firstOrCreate(
            ['user_id' => $owner->id, 'code' => PlanEbitdaMatrix::CODE_KDKMP_GERAI],
            [
                'business_process_id' => $businessProcess->id,
                'unit_cost_assumption_id' => $unitCostAssumption->id,
                'revenue_plan_id' => $revenuePlan->id,
                'name' => 'EBITDA MATRIX RENCANA',
                'source_sheet' => '4. PLAN EBITDA MATRIX',
            ]
        );

        if (! $matrix->wasRecentlyCreated) {
            return;
        }

        foreach ($businessProcess->steps as $step) {
            $matrix->processes()->create([
                'business_process_step_id' => $step->id,
                'sequence' => $step->sequence,
                'process_group' => $step->process_group,
                'detail_process' => $step->detail_process,
                'unit_name' => null,
                'pic' => $step->pic,
            ]);
        }

        $data = require database_path('seeders/data/kdkmp_gerai_plan_ebitda_matrix.php');

        foreach ($data['rows'] as $row) {
            $matrix->rows()->create($row);
        }
    }
}
