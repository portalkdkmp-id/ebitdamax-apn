<?php

namespace App\Http\Controllers;

use App\Actions\ResolveEbitdaKdkmpDataOwnerAction;
use App\Actions\SaveBusinessProcessAction;
use App\Http\Requests\SaveBusinessProcessRequest;
use App\Models\BusinessProcess;
use App\Models\BusinessProcessStep;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BusinessProcessController extends Controller
{
    public function kdkmpGerai(
        Request $request,
        ResolveEbitdaKdkmpDataOwnerAction $resolveDataOwner
    ): Response {
        Gate::authorize('viewAny', BusinessProcess::class);

        $authenticatedUser = $request->user();
        abort_unless($authenticatedUser instanceof User, 401);

        $requestedOwner = trim((string) $request->query('owner'));
        $ownerContext = $resolveDataOwner->handle(
            $authenticatedUser,
            $requestedOwner === '' ? null : $requestedOwner
        );

        $businessProcess = BusinessProcess::query()
            ->with('steps')
            ->whereBelongsTo($ownerContext['owner'])
            ->where('code', BusinessProcess::CODE_KDKMP_GERAI)
            ->first();

        if ($businessProcess !== null) {
            Gate::authorize('view', $businessProcess);
        }

        return Inertia::render('BusinessProcesses/KdkmpGerai', [
            'businessProcess' => $businessProcess === null
                ? $this->template()
                : [
                    'id' => $businessProcess->id,
                    'code' => $businessProcess->code,
                    'name' => $businessProcess->name,
                    'unit_name' => $businessProcess->unit_name,
                    'unit_code' => $businessProcess->unit_code,
                    'steps' => $businessProcess->steps
                        ->map(fn (BusinessProcessStep $step): array => [
                            'id' => $step->id,
                            'sequence' => $step->sequence,
                            'process_group' => $step->process_group,
                            'detail_process' => $step->detail_process,
                            'pic' => $step->pic,
                            'standard_time_minutes' => $step->standard_time_minutes,
                            'output_target' => $step->output_target,
                            'responsibility_value' => $step->responsibility_value,
                        ])
                        ->values()
                        ->all(),
                ],
            'totalStandardTimeMinutes' => $businessProcess?->steps
                ->sum('standard_time_minutes') ?? 0,
            'can' => [
                'create' => $businessProcess === null
                    && Gate::allows('create', BusinessProcess::class),
                'update' => $businessProcess !== null && Gate::allows('update', $businessProcess),
            ],
            'dataOwner' => $ownerContext['dataOwner'],
            'dataOwnerOptions' => $ownerContext['dataOwnerOptions'],
            'canSelectDataOwner' => $ownerContext['canSelectDataOwner'],
        ]);
    }

    public function store(
        SaveBusinessProcessRequest $request,
        SaveBusinessProcessAction $saveBusinessProcess
    ): RedirectResponse {
        $owner = $request->user();
        abort_unless($owner instanceof User, 401);

        $saveBusinessProcess->handle($owner, null, $request->validated());

        return back()->with('success', 'Business Process berhasil dibuat.');
    }

    public function update(
        SaveBusinessProcessRequest $request,
        BusinessProcess $businessProcess,
        SaveBusinessProcessAction $saveBusinessProcess
    ): RedirectResponse {
        abort_unless($businessProcess->code === BusinessProcess::CODE_KDKMP_GERAI, 404);

        $owner = $request->user();
        abort_unless($owner instanceof User, 401);

        $saveBusinessProcess->handle($owner, $businessProcess, $request->validated());

        return back()->with('success', 'Business Process berhasil diperbarui.');
    }

    /**
     * @return array<string, mixed>
     */
    private function template(): array
    {
        return [
            'id' => null,
            'code' => BusinessProcess::CODE_KDKMP_GERAI,
            'name' => 'BUSINES PROCESS',
            'unit_name' => null,
            'unit_code' => null,
            'steps' => collect(range(1, 17))
                ->map(fn (int $sequence): array => [
                    'id' => null,
                    'sequence' => $sequence,
                    'process_group' => '',
                    'detail_process' => '',
                    'pic' => '',
                    'standard_time_minutes' => 0,
                    'output_target' => null,
                    'responsibility_value' => null,
                ])
                ->all(),
        ];
    }
}
