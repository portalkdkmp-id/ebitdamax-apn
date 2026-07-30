<?php

namespace App\Http\Controllers;

use App\Actions\ResolveEbitdaKdkmpDataOwnerAction;
use App\Actions\SaveRevenuePlanAction;
use App\Http\Requests\SaveRevenuePlanRequest;
use App\Models\RevenuePlan;
use App\Models\RevenuePlanRow;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class RevenuePlanController extends Controller
{
    public function kdkmpGerai(
        Request $request,
        ResolveEbitdaKdkmpDataOwnerAction $resolveDataOwner
    ): Response {
        Gate::authorize('viewAny', RevenuePlan::class);

        $authenticatedUser = $request->user();
        abort_unless($authenticatedUser instanceof User, 401);

        $requestedOwner = trim((string) $request->query('owner'));
        $ownerContext = $resolveDataOwner->handle(
            $authenticatedUser,
            $requestedOwner === '' ? null : $requestedOwner
        );

        $revenuePlan = RevenuePlan::query()
            ->with('rows')
            ->whereBelongsTo($ownerContext['owner'])
            ->where('code', RevenuePlan::CODE_KDKMP_GERAI)
            ->first();

        if ($revenuePlan !== null) {
            Gate::authorize('view', $revenuePlan);
        }

        return Inertia::render('RevenuePlans/KdkmpGerai', [
            'revenuePlan' => $revenuePlan === null
                ? $this->template()
                : [
                    'id' => $revenuePlan->id,
                    'code' => $revenuePlan->code,
                    'name' => $revenuePlan->name,
                    'plan_date' => $revenuePlan->plan_date->toDateString(),
                    'rka_revenue_target' => $this->number($revenuePlan->rka_revenue_target),
                    'planned_production_quantity' => $this->number($revenuePlan->planned_production_quantity),
                    'days_per_month' => $revenuePlan->days_per_month,
                    'daily_rka_revenue_target' => $this->number($revenuePlan->daily_rka_revenue_target),
                    'planned_total_daily_revenue' => $this->number($revenuePlan->planned_total_daily_revenue),
                    'source_sheet' => $revenuePlan->source_sheet,
                    'rows' => $revenuePlan->rows
                        ->map(fn (RevenuePlanRow $row): array => $this->transformRow($row))
                        ->values()
                        ->all(),
                ],
            'can' => [
                'create' => $revenuePlan === null
                    && Gate::allows('create', RevenuePlan::class),
                'update' => $revenuePlan !== null && Gate::allows('update', $revenuePlan),
            ],
            'dataOwner' => $ownerContext['dataOwner'],
            'dataOwnerOptions' => $ownerContext['dataOwnerOptions'],
            'canSelectDataOwner' => $ownerContext['canSelectDataOwner'],
        ]);
    }

    public function store(
        SaveRevenuePlanRequest $request,
        SaveRevenuePlanAction $saveRevenuePlan
    ): RedirectResponse {
        $owner = $request->user();
        abort_unless($owner instanceof User, 401);

        $saveRevenuePlan->handle($owner, null, $request->validated());

        return back()->with('success', 'Rencana Pendapatan berhasil dibuat.');
    }

    public function update(
        SaveRevenuePlanRequest $request,
        RevenuePlan $revenuePlan,
        SaveRevenuePlanAction $saveRevenuePlan
    ): RedirectResponse {
        abort_unless($revenuePlan->code === RevenuePlan::CODE_KDKMP_GERAI, 404);

        $owner = $request->user();
        abort_unless($owner instanceof User, 401);

        $saveRevenuePlan->handle($owner, $revenuePlan, $request->validated());

        return back()->with('success', 'Rencana Pendapatan berhasil diperbarui.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformRow(RevenuePlanRow $row): array
    {
        return [
            'id' => $row->id,
            'sort_order' => $row->sort_order,
            'row_type' => $row->row_type,
            'display_number' => $row->display_number,
            'revenue_service' => $row->revenue_service,
            'planned_volume' => $this->number($row->planned_volume),
            'unit' => $row->unit,
            'rate' => $this->number($row->rate),
            'planned_revenue' => $this->number($row->planned_revenue),
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
        $rows = require database_path('seeders/data/kdkmp_gerai_revenue_plan.php');

        return [
            'id' => null,
            'code' => RevenuePlan::CODE_KDKMP_GERAI,
            'name' => 'RENCANA PENDAPATAN',
            'plan_date' => null,
            'rka_revenue_target' => null,
            'planned_production_quantity' => null,
            'days_per_month' => null,
            'daily_rka_revenue_target' => null,
            'planned_total_daily_revenue' => null,
            'source_sheet' => '3. RENCANA PENDAPATAN',
            'rows' => collect($rows)
                ->map(fn (array $row): array => [
                    ...$row,
                    'id' => null,
                    'revenue_service' => null,
                    'planned_volume' => null,
                    'unit' => null,
                    'rate' => null,
                    'planned_revenue' => null,
                ])
                ->values()
                ->all(),
        ];
    }
}
