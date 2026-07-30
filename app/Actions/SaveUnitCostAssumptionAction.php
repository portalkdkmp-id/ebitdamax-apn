<?php

namespace App\Actions;

use App\Models\UnitCostAssumption;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaveUnitCostAssumptionAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $owner, ?UnitCostAssumption $assumption, array $data): UnitCostAssumption
    {
        return DB::transaction(function () use ($owner, $assumption, $data): UnitCostAssumption {
            if ($assumption === null) {
                $owner = User::query()->lockForUpdate()->findOrFail($owner->id);

                if (UnitCostAssumption::query()
                    ->whereBelongsTo($owner)
                    ->where('code', UnitCostAssumption::CODE_KDKMP_GERAI)
                    ->exists()
                ) {
                    throw ValidationException::withMessages([
                        'form' => 'Data Unit Cost Assumption sudah tersedia. Gunakan aksi edit.',
                    ]);
                }

                $assumption = new UnitCostAssumption([
                    'user_id' => $owner->id,
                    'code' => UnitCostAssumption::CODE_KDKMP_GERAI,
                    'source_sheet' => '2. UNIT COST ASSUMPTION',
                ]);
            } else {
                $assumption = UnitCostAssumption::query()
                    ->lockForUpdate()
                    ->findOrFail($assumption->id);
            }

            $assumption->fill(Arr::except($data, 'rows'));
            $assumption->save();

            foreach ($data['rows'] as $row) {
                $assumption->rows()->updateOrCreate(
                    ['sort_order' => $row['sort_order']],
                    $row
                );
            }

            return $assumption->load('rows');
        });
    }
}
