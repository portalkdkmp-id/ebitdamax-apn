<?php

namespace App\Http\Controllers;

use App\Enums\TaskReportStatus;
use App\Enums\TaskType;
use App\Http\Requests\StoreTaskBmcDailySelectionRequest;
use App\Models\BmcPoint;
use App\Models\Task;
use App\Models\TaskBmcDailySelection;
use App\Models\TaskReport;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskBmcDailySelectionController extends Controller
{
    public function store(StoreTaskBmcDailySelectionRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->role_id !== null, 403);

        $businessDate = CarbonImmutable::now((string) config('app.kdkmp_business_timezone'));
        $bmcPointId = (int) $request->validated('bmc_point_id');

        DB::transaction(function () use ($bmcPointId, $businessDate, $user): void {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();

            $bmcPoint = BmcPoint::query()->findOrFail($bmcPointId);

            $hasEligibleTask = Task::query()
                ->active()
                ->where('task_type', TaskType::KegiatanStrategisPilihan->value)
                ->where('bmc_point_id', $bmcPoint->id)
                ->whereHas('roles', fn ($query) => $query->whereKey($user->role_id))
                ->exists();

            if (! $hasEligibleTask) {
                throw ValidationException::withMessages([
                    'bmc_point_id' => 'Poin BMC tidak memiliki task aktif untuk role Anda.',
                ]);
            }

            $selection = TaskBmcDailySelection::query()
                ->where('user_id', $user->id)
                ->whereDate('selection_date', $businessDate->toDateString())
                ->lockForUpdate()
                ->first();

            $hasStartedBmcTask = TaskReport::query()
                ->where('user_id', $user->id)
                ->where('period_key', $businessDate->toDateString())
                ->whereIn('status', [
                    TaskReportStatus::InProgress->value,
                    TaskReportStatus::Completed->value,
                ])
                ->whereHas('task', function ($query): void {
                    $query->where('task_type', TaskType::KegiatanStrategisPilihan->value);
                })
                ->exists();

            if ($hasStartedBmcTask) {
                throw ValidationException::withMessages([
                    'bmc_point_id' => 'Pilihan poin BMC tidak dapat diubah setelah task BMC dimulai.',
                ]);
            }

            if ($selection) {
                $selection->update(['bmc_point_id' => $bmcPoint->id]);

                return;
            }

            TaskBmcDailySelection::query()->create([
                'user_id' => $user->id,
                'bmc_point_id' => $bmcPoint->id,
                'selection_date' => $businessDate->toDateString(),
            ]);
        });

        return back()->with('success', 'Poin BMC untuk hari ini berhasil dipilih.');
    }
}
