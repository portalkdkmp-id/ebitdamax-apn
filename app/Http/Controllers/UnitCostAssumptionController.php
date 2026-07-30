<?php

namespace App\Http\Controllers;

use App\Actions\ResolveEbitdaKdkmpDataOwnerAction;
use App\Actions\SaveUnitCostAssumptionAction;
use App\Http\Requests\SaveUnitCostAssumptionRequest;
use App\Models\UnitCostAssumption;
use App\Models\UnitCostAssumptionRow;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UnitCostAssumptionController extends Controller
{
    public function kdkmpGerai(
        Request $request,
        ResolveEbitdaKdkmpDataOwnerAction $resolveDataOwner
    ): Response {
        Gate::authorize('viewAny', UnitCostAssumption::class);

        $authenticatedUser = $request->user();
        abort_unless($authenticatedUser instanceof User, 401);

        $requestedOwner = trim((string) $request->query('owner'));
        $ownerContext = $resolveDataOwner->handle(
            $authenticatedUser,
            $requestedOwner === '' ? null : $requestedOwner
        );

        $assumption = UnitCostAssumption::query()
            ->with('rows')
            ->whereBelongsTo($ownerContext['owner'])
            ->where('code', UnitCostAssumption::CODE_KDKMP_GERAI)
            ->first();

        if ($assumption !== null) {
            Gate::authorize('view', $assumption);
        }

        return Inertia::render('UnitCostAssumptions/KdkmpGerai', [
            'assumption' => $assumption === null
                ? $this->template()
                : [
                    'id' => $assumption->id,
                    'code' => $assumption->code,
                    'name' => $assumption->name,
                    'assumption_date' => $assumption->assumption_date->toDateString(),
                    'days_per_year' => $assumption->days_per_year,
                    'days_per_month' => $assumption->days_per_month,
                    'work_hours_per_day' => (float) $assumption->work_hours_per_day,
                    'source_sheet' => $assumption->source_sheet,
                    'rows' => $assumption->rows
                        ->map(fn (UnitCostAssumptionRow $row): array => $this->transformRow($row))
                        ->values()
                        ->all(),
                ],
            'can' => [
                'create' => $assumption === null
                    && Gate::allows('create', UnitCostAssumption::class),
                'update' => $assumption !== null && Gate::allows('update', $assumption),
            ],
            'dataOwner' => $ownerContext['dataOwner'],
            'dataOwnerOptions' => $ownerContext['dataOwnerOptions'],
            'canSelectDataOwner' => $ownerContext['canSelectDataOwner'],
        ]);
    }

    public function store(
        SaveUnitCostAssumptionRequest $request,
        SaveUnitCostAssumptionAction $saveUnitCostAssumption
    ): RedirectResponse {
        $owner = $request->user();
        abort_unless($owner instanceof User, 401);

        $saveUnitCostAssumption->handle($owner, null, $request->validated());

        return back()->with('success', 'Unit Cost Assumption berhasil dibuat.');
    }

    public function update(
        SaveUnitCostAssumptionRequest $request,
        UnitCostAssumption $unitCostAssumption,
        SaveUnitCostAssumptionAction $saveUnitCostAssumption
    ): RedirectResponse {
        abort_unless($unitCostAssumption->code === UnitCostAssumption::CODE_KDKMP_GERAI, 404);

        $owner = $request->user();
        abort_unless($owner instanceof User, 401);

        $saveUnitCostAssumption->handle($owner, $unitCostAssumption, $request->validated());

        return back()->with('success', 'Unit Cost Assumption berhasil diperbarui.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformRow(UnitCostAssumptionRow $row): array
    {
        return [
            'id' => $row->id,
            'sort_order' => $row->sort_order,
            'source_page' => $row->source_page,
            'row_type' => $row->row_type,
            'section_code' => $row->section_code,
            'category' => $row->category,
            'cost_type' => $row->cost_type,
            'component' => $row->component,
            'plan_quantity' => $this->number($row->plan_quantity),
            'actual_quantity' => $this->number($row->actual_quantity),
            'description' => $row->description,
            'unit' => $row->unit,
            'base_price' => $this->number($row->base_price),
            'plan_daily_cost' => $this->number($row->plan_daily_cost),
            'plan_hourly_cost' => $this->number($row->plan_hourly_cost),
            'actual_daily_cost' => $this->number($row->actual_daily_cost),
            'actual_hourly_cost' => $this->number($row->actual_hourly_cost),
            'plan_value' => $this->number($row->plan_value),
            'actual_value' => $this->number($row->actual_value),
        ];
    }

    private function number(?string $value): ?float
    {
        return $value === null ? null : (float) $value;
    }

    /**
     * @return array<string, mixed>
     */
    private function template(): array
    {
        $rows = require database_path('seeders/data/kdkmp_gerai_unit_cost_assumption.php');

        return [
            'id' => null,
            'code' => UnitCostAssumption::CODE_KDKMP_GERAI,
            'name' => 'UNIT COST PER-HARI & PER-JAM',
            'assumption_date' => null,
            'days_per_year' => null,
            'days_per_month' => null,
            'work_hours_per_day' => null,
            'source_sheet' => '2. UNIT COST ASSUMPTION',
            'rows' => collect($rows)
                ->map(fn (array $row): array => [
                    ...$row,
                    'id' => null,
                    'plan_quantity' => null,
                    'actual_quantity' => null,
                    'description' => null,
                    'unit' => null,
                    'base_price' => null,
                    'plan_daily_cost' => null,
                    'plan_hourly_cost' => null,
                    'actual_daily_cost' => null,
                    'actual_hourly_cost' => null,
                    'plan_value' => null,
                    'actual_value' => null,
                ])
                ->values()
                ->all(),
        ];
    }
}
