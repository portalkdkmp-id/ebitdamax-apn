<?php

namespace App\Actions;

use App\Models\BusinessProcess;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaveBusinessProcessAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $owner, ?BusinessProcess $businessProcess, array $data): BusinessProcess
    {
        return DB::transaction(function () use ($owner, $businessProcess, $data): BusinessProcess {
            if ($businessProcess === null) {
                $owner = User::query()->lockForUpdate()->findOrFail($owner->id);

                if (BusinessProcess::query()
                    ->whereBelongsTo($owner)
                    ->where('code', BusinessProcess::CODE_KDKMP_GERAI)
                    ->exists()
                ) {
                    throw ValidationException::withMessages([
                        'form' => 'Data Business Process sudah tersedia. Gunakan aksi edit.',
                    ]);
                }

                $businessProcess = new BusinessProcess([
                    'user_id' => $owner->id,
                    'code' => BusinessProcess::CODE_KDKMP_GERAI,
                ]);
            } else {
                $businessProcess = BusinessProcess::query()
                    ->lockForUpdate()
                    ->findOrFail($businessProcess->id);
            }

            $businessProcess->fill(Arr::except($data, 'steps'));
            $businessProcess->save();

            foreach ($data['steps'] as $step) {
                $businessProcess->steps()->updateOrCreate(
                    ['sequence' => $step['sequence']],
                    $step
                );
            }

            return $businessProcess->load('steps');
        });
    }
}
