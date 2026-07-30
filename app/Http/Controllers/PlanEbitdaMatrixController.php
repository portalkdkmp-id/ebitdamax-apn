<?php

namespace App\Http\Controllers;

use App\Actions\ResolveEbitdaKdkmpDataOwnerAction;
use App\Actions\SavePlanEbitdaMatrixAction;
use App\Http\Requests\SavePlanEbitdaMatrixRequest;
use App\Models\BusinessProcess;
use App\Models\BusinessProcessStep;
use App\Models\PlanEbitdaMatrix;
use App\Models\PlanEbitdaMatrixProcess;
use App\Models\PlanEbitdaMatrixRow;
use App\Models\RevenuePlan;
use App\Models\UnitCostAssumption;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PlanEbitdaMatrixController extends Controller
{
    public function kdkmpGerai(
        Request $request,
        ResolveEbitdaKdkmpDataOwnerAction $resolveDataOwner
    ): Response {
        Gate::authorize('viewAny', PlanEbitdaMatrix::class);

        $authenticatedUser = $request->user();
        abort_unless($authenticatedUser instanceof User, 401);

        $requestedOwner = trim((string) $request->query('owner'));
        $ownerContext = $resolveDataOwner->handle(
            $authenticatedUser,
            $requestedOwner === '' ? null : $requestedOwner
        );
        $owner = $ownerContext['owner'];

        $businessProcess = BusinessProcess::query()
            ->with('steps')
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
        $dependenciesComplete = $businessProcess !== null
            && $unitCostAssumption !== null
            && $revenuePlan !== null;

        $matrix = PlanEbitdaMatrix::query()
            ->with(['processes', 'rows'])
            ->whereBelongsTo($owner)
            ->where('code', PlanEbitdaMatrix::CODE_KDKMP_GERAI)
            ->first();

        if ($matrix !== null) {
            Gate::authorize('view', $matrix);
        }

        return Inertia::render('PlanEbitdaMatrices/KdkmpGerai', [
            'matrix' => $matrix === null
                ? $this->template($businessProcess?->steps)
                : $this->transformMatrix($matrix),
            'can' => [
                'create' => $matrix === null
                    && $dependenciesComplete
                    && Gate::allows('create', PlanEbitdaMatrix::class),
                'update' => $matrix !== null && Gate::allows('update', $matrix),
            ],
            'dependencies' => [
                'businessProcess' => $businessProcess !== null,
                'unitCostAssumption' => $unitCostAssumption !== null,
                'revenuePlan' => $revenuePlan !== null,
                'complete' => $dependenciesComplete,
            ],
            'dataOwner' => $ownerContext['dataOwner'],
            'dataOwnerOptions' => $ownerContext['dataOwnerOptions'],
            'canSelectDataOwner' => $ownerContext['canSelectDataOwner'],
        ]);
    }

    public function store(
        SavePlanEbitdaMatrixRequest $request,
        SavePlanEbitdaMatrixAction $savePlanEbitdaMatrix
    ): RedirectResponse {
        $owner = $request->user();
        abort_unless($owner instanceof User, 401);

        $savePlanEbitdaMatrix->handle($owner, null, $request->validated());

        return back()->with('success', 'Plan EBITDA Matrix berhasil dibuat.');
    }

    public function update(
        SavePlanEbitdaMatrixRequest $request,
        PlanEbitdaMatrix $planEbitdaMatrix,
        SavePlanEbitdaMatrixAction $savePlanEbitdaMatrix
    ): RedirectResponse {
        abort_unless($planEbitdaMatrix->code === PlanEbitdaMatrix::CODE_KDKMP_GERAI, 404);

        $owner = $request->user();
        abort_unless($owner instanceof User, 401);

        $savePlanEbitdaMatrix->handle($owner, $planEbitdaMatrix, $request->validated());

        return back()->with('success', 'Plan EBITDA Matrix berhasil diperbarui.');
    }

    /** @return array<string, mixed> */
    private function transformMatrix(PlanEbitdaMatrix $matrix): array
    {
        return [
            'id' => $matrix->id,
            'code' => $matrix->code,
            'name' => $matrix->name,
            'source_sheet' => $matrix->source_sheet,
            'processes' => $matrix->processes
                ->map(fn (PlanEbitdaMatrixProcess $process): array => $this->transformProcess($process))
                ->values()
                ->all(),
            'rows' => $matrix->rows
                ->map(fn (PlanEbitdaMatrixRow $row): array => $this->transformRow($row))
                ->values()
                ->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function transformProcess(PlanEbitdaMatrixProcess $process): array
    {
        return [
            'id' => $process->id,
            'sequence' => $process->sequence,
            'process_group' => $process->process_group,
            'detail_process' => $process->detail_process,
            'unit_name' => $process->unit_name,
            'pic' => $process->pic,
        ];
    }

    /** @return array<string, mixed> */
    private function transformRow(PlanEbitdaMatrixRow $row): array
    {
        return [
            'id' => $row->id,
            'section_code' => $row->section_code,
            'sort_order' => $row->sort_order,
            'row_type' => $row->row_type,
            'label' => $row->label,
            'values' => $row->values,
            'total' => $row->total,
            'notes' => $row->notes,
            'notes_tone' => $row->notes_tone,
            'is_calculated' => $row->is_calculated,
            'source_page' => $row->source_page,
        ];
    }

    /**
     * @param  Collection<int, BusinessProcessStep>|null  $ownerSteps
     * @return array<string, mixed>
     */
    private function template(?Collection $ownerSteps): array
    {
        $steps = $ownerSteps;

        if ($steps === null || $steps->isEmpty()) {
            $steps = BusinessProcess::query()
                ->whereHas('user', fn ($query) => $query->where('email', User::EMAIL_KDKMP_GERAI))
                ->where('code', BusinessProcess::CODE_KDKMP_GERAI)
                ->first()?->steps()
                ->get();
        }

        $data = require database_path('seeders/data/kdkmp_gerai_plan_ebitda_matrix.php');

        return [
            'id' => null,
            'code' => PlanEbitdaMatrix::CODE_KDKMP_GERAI,
            'name' => 'EBITDA MATRIX RENCANA',
            'source_sheet' => '4. PLAN EBITDA MATRIX',
            'processes' => ($steps ?? collect())
                ->map(fn (BusinessProcessStep $step): array => [
                    'id' => null,
                    'sequence' => $step->sequence,
                    'process_group' => $step->process_group,
                    'detail_process' => $step->detail_process,
                    'unit_name' => null,
                    'pic' => $step->pic,
                ])
                ->values()
                ->all(),
            'rows' => collect($data['rows'])
                ->map(fn (array $row): array => [
                    ...$row,
                    'id' => null,
                    'values' => array_fill(0, 17, null),
                    'total' => null,
                ])
                ->all(),
        ];
    }
}
