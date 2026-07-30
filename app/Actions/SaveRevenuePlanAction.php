<?php

namespace App\Actions;

use App\Models\RevenuePlan;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaveRevenuePlanAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $owner, ?RevenuePlan $revenuePlan, array $data): RevenuePlan
    {
        return DB::transaction(function () use ($owner, $revenuePlan, $data): RevenuePlan {
            if ($revenuePlan === null) {
                $owner = User::query()->lockForUpdate()->findOrFail($owner->id);

                if (RevenuePlan::query()
                    ->whereBelongsTo($owner)
                    ->where('code', RevenuePlan::CODE_KDKMP_GERAI)
                    ->exists()
                ) {
                    throw ValidationException::withMessages([
                        'form' => 'Data Rencana Pendapatan sudah tersedia. Gunakan aksi edit.',
                    ]);
                }

                $revenuePlan = new RevenuePlan([
                    'user_id' => $owner->id,
                    'code' => RevenuePlan::CODE_KDKMP_GERAI,
                    'source_sheet' => '3. RENCANA PENDAPATAN',
                ]);
            } else {
                $revenuePlan = RevenuePlan::query()
                    ->lockForUpdate()
                    ->findOrFail($revenuePlan->id);
            }

            $revenuePlan->fill(Arr::except($data, 'rows'));
            $revenuePlan->save();

            foreach ($data['rows'] as $row) {
                $revenuePlan->rows()->updateOrCreate(
                    ['sort_order' => $row['sort_order']],
                    $row
                );
            }

            return $revenuePlan->load('rows');
        });
    }
}
