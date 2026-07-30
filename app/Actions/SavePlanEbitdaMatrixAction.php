<?php

namespace App\Actions;

use App\Models\BusinessProcess;
use App\Models\PlanEbitdaMatrix;
use App\Models\RevenuePlan;
use App\Models\UnitCostAssumption;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SavePlanEbitdaMatrixAction
{
    /** @param array<string, mixed> $data */
    public function handle(
        User $owner,
        ?PlanEbitdaMatrix $planEbitdaMatrix,
        array $data
    ): PlanEbitdaMatrix {
        return DB::transaction(function () use ($owner, $planEbitdaMatrix, $data): PlanEbitdaMatrix {
            $owner = User::query()->lockForUpdate()->findOrFail($owner->id);
            $businessProcess = BusinessProcess::query()
                ->whereBelongsTo($owner)
                ->where('code', BusinessProcess::CODE_KDKMP_GERAI)
                ->first();
            $unitCostAssumption = UnitCostAssumption::query()
                ->whereBelongsTo($owner)
                ->where('code', UnitCostAssumption::CODE_KDKMP_GERAI)
                ->first();
            $revenuePlan = RevenuePlan::query()
                ->whereBelongsTo($owner)
                ->where('code', RevenuePlan::CODE_KDKMP_GERAI)
                ->first();

            if ($businessProcess === null || $unitCostAssumption === null || $revenuePlan === null) {
                throw ValidationException::withMessages([
                    'form' => 'Lengkapi Business Process, Unit Cost Assumption, dan Rencana Pendapatan terlebih dahulu.',
                ]);
            }

            if ($planEbitdaMatrix === null) {
                if (PlanEbitdaMatrix::query()
                    ->whereBelongsTo($owner)
                    ->where('code', PlanEbitdaMatrix::CODE_KDKMP_GERAI)
                    ->exists()
                ) {
                    throw ValidationException::withMessages([
                        'form' => 'Data Plan EBITDA Matrix sudah tersedia. Gunakan aksi edit.',
                    ]);
                }

                $planEbitdaMatrix = new PlanEbitdaMatrix([
                    'user_id' => $owner->id,
                    'code' => PlanEbitdaMatrix::CODE_KDKMP_GERAI,
                    'source_sheet' => '4. PLAN EBITDA MATRIX',
                ]);
            } else {
                $planEbitdaMatrix = PlanEbitdaMatrix::query()
                    ->whereBelongsTo($owner)
                    ->lockForUpdate()
                    ->findOrFail($planEbitdaMatrix->id);
            }

            $planEbitdaMatrix->fill([
                ...Arr::only($data, ['name']),
                'business_process_id' => $businessProcess->id,
                'unit_cost_assumption_id' => $unitCostAssumption->id,
                'revenue_plan_id' => $revenuePlan->id,
            ]);
            $planEbitdaMatrix->save();

            $steps = $businessProcess->steps()->get()->keyBy('sequence');

            foreach ($data['processes'] as $process) {
                $planEbitdaMatrix->processes()->updateOrCreate(
                    ['sequence' => $process['sequence']],
                    [
                        ...$process,
                        'business_process_step_id' => $steps->get($process['sequence'])?->id,
                    ]
                );
            }

            foreach ($data['rows'] as $row) {
                $planEbitdaMatrix->rows()->updateOrCreate(
                    ['sort_order' => $row['sort_order']],
                    $row
                );
            }

            return $planEbitdaMatrix->load(['processes', 'rows']);
        });
    }
}
