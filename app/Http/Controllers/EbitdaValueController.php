<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEbitdaValueRequest;
use App\Http\Requests\UpdateEbitdaValueRequest;
use App\Models\EbitdaValue;
use App\Models\Organization;
use App\Services\EbitdaFormulaService;
use App\Services\EbitdaOrganizationValueService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EbitdaValueController extends Controller
{
    public function __construct(private EbitdaOrganizationValueService $organizationValueService) {}

    public function index(Request $request): Response
    {
        $this->organizationValueService->flushCache();

        $search = trim((string) $request->input('search', ''));
        $year = $request->input('year', now()->year);

        $groups = Organization::query()
            ->active()
            ->with([
                'ebitdaValues' => fn ($query) => $query
                    ->whereIn('scenario', $this->visibleScenarioKeys())
                    ->when($year, fn ($query) => $query->where('year', $year))
                    ->with('organization')
                    ->orderBy('scenario'),
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($subQuery) use ($search): void {
                    $subQuery
                        ->where('code', 'ilike', "%{$search}%")
                        ->orWhere('name', 'ilike', "%{$search}%")
                        ->orWhere('level', 'ilike', "%{$search}%");
                });
            })
            ->ordered()
            ->paginate(25)
            ->through(fn (Organization $organization): array => $this->transformOrganizationGroup($organization))
            ->appends($request->only(['search', 'year']));

        $organizations = Organization::query()
            ->active()
            ->ordered()
            ->get(['id', 'code', 'name', 'level']);

        return Inertia::render('EbitdaValues/Index', [
            'groups' => $groups,
            'organizations' => $organizations,
            'filters' => [
                'search' => $search,
                'year' => (int) $year,
            ],
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function visibleScenarioKeys(): array
    {
        return [
            EbitdaValue::SCENARIO_DIRECT_INPUT,
            ...$this->organizationValueService->scenarioKeys(),
        ];
    }

    public function store(
        StoreEbitdaValueRequest $request,
        EbitdaFormulaService $formulaService
    ): RedirectResponse {
        $payload = $formulaService->calculateFromPayload($request->validated());

        EbitdaValue::query()->updateOrCreate(
            [
                'organization_id' => $payload['organization_id'],
                'year' => $payload['year'],
                'period_date' => $payload['period_date'] ?? null,
                'scenario' => $payload['scenario'],
            ],
            $payload
        );

        $this->organizationValueService->flushCache();

        return back()->with('success', 'Data EBITDA berhasil disimpan.');
    }

    public function update(
        UpdateEbitdaValueRequest $request,
        EbitdaValue $ebitdaValue,
        EbitdaFormulaService $formulaService
    ): RedirectResponse {
        $payload = $formulaService->calculateFromPayload($request->validated());

        $ebitdaValue->update($payload);

        $this->organizationValueService->flushCache();

        return back()->with('success', 'Data EBITDA berhasil diperbarui.');
    }

    public function destroy(EbitdaValue $ebitdaValue): RedirectResponse
    {
        $ebitdaValue->delete();

        $this->organizationValueService->flushCache();

        return back()->with('success', 'Data EBITDA berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformEbitdaValue(EbitdaValue $value): array
    {
        $organization = $value->organization;
        $rawValue = $this->organizationValueService->valueFromRow($value);
        $resolvedValue = $organization
            ? $this->organizationValueService->resolve($organization, (int) $value->year, (string) $value->scenario)
            : [
                'source' => 'empty',
                'value' => $rawValue,
            ];

        return [
            'id' => $value->id,
            'organization_id' => $value->organization_id,
            'period_date' => $value->period_date?->toDateString(),
            'year' => $value->year,
            'scenario' => $value->scenario,
            'source_sheet' => $value->source_sheet,
            'value_source' => $resolvedValue['source'],
            'resolved_value' => $resolvedValue['value'],
            'classification' => $value->classification,
            'revenue' => (float) $rawValue['revenue'],
            'doc_variable' => (float) $rawValue['doc_variable'],
            'doc_fixed' => (float) $rawValue['doc_fixed'],
            'ioc' => (float) $rawValue['ioc'],
            'toc' => (float) $rawValue['toc'],
            'ebitda' => (float) $rawValue['ebitda'],
            'ebitda_margin' => $rawValue['ebitda_margin'],
            'man_cost' => (float) $value->man_cost,
            'method_cost' => (float) $value->method_cost,
            'material_cost' => (float) $value->material_cost,
            'machine_cost' => (float) $value->machine_cost,
            'organization' => $organization ? [
                'id' => $organization->id,
                'code' => $organization->code,
                'name' => $organization->name,
                'level' => $organization->level,
                'is_revenue_center' => $organization->is_revenue_center,
                'is_cost_center' => $organization->is_cost_center,
            ] : null,
        ];
    }

    /**
     * @return array{organization: array<string, mixed>, values: array<int, array<string, mixed>>, is_unfilled: bool}
     */
    private function transformOrganizationGroup(Organization $organization): array
    {
        $values = $organization->ebitdaValues
            ->map(fn (EbitdaValue $value): array => $this->transformEbitdaValue($value))
            ->values()
            ->all();

        return [
            'organization' => [
                'id' => $organization->id,
                'code' => $organization->code,
                'name' => $organization->name,
                'level' => $organization->level,
                'is_revenue_center' => $organization->is_revenue_center,
                'is_cost_center' => $organization->is_cost_center,
            ],
            'values' => $values,
            'is_unfilled' => $values === [],
        ];
    }
}
