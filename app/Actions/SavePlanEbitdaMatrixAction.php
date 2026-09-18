<?php

namespace App\Actions;

use App\Models\PlanEbitdaMatrix;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

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

            $planEbitdaMatrix->fill(Arr::only($data, ['name']));
            $planEbitdaMatrix->save();

            foreach ($data['processes'] as $process) {
                $planEbitdaMatrix->processes()->updateOrCreate(
                    ['sequence' => $process['sequence']],
                    $process
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
