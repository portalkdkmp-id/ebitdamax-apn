<?php

namespace App\Http\Controllers;

use App\Models\EbitdaValue;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationCalculationController extends Controller
{
    public function index(Request $request): Response
    {
        $year = (int) $request->input('year', now()->year);
        $scenario = (string) $request->input('scenario', EbitdaValue::SCENARIO_TARGET_TAHUNAN);
        $search = trim((string) $request->input('search', ''));
        $classification = trim((string) $request->input('classification', 'all'));

        $query = EbitdaValue::query()
            ->select('ebitda_values.*')
            ->join('organizations', 'organizations.id', '=', 'ebitda_values.organization_id')
            ->with('organization')
            ->where('ebitda_values.year', $year)
            ->where('ebitda_values.scenario', $scenario)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('organizations.code', 'ilike', "%{$search}%")
                        ->orWhere('organizations.name', 'ilike', "%{$search}%")
                        ->orWhere('organizations.level', 'ilike', "%{$search}%")
                        ->orWhere('ebitda_values.classification', 'ilike', "%{$search}%");
                });
            })
            ->when($classification !== '' && $classification !== 'all', function ($query) use ($classification) {
                $query->where('ebitda_values.classification', $classification);
            });

        $calculations = (clone $query)
            ->orderBy('organizations.sort_order')
            ->limit(500)
            ->get()
            ->map(function (EbitdaValue $calculation) {
                $organization = $calculation->organization;

                return [
                    'id' => $calculation->id,
                    'organization_id' => $calculation->organization_id,
                    'year' => $calculation->year,
                    'scenario' => $calculation->scenario,
                    'code' => $organization?->code,
                    'name' => $organization?->name,
                    'level' => $organization?->level,
                    'directorate_group' => $organization?->directorate_group,
                    'is_revenue_center' => $organization?->is_revenue_center,
                    'is_cost_center' => $organization?->is_cost_center,

                    'source_sheet' => $calculation->source_sheet,
                    'classification' => $calculation->classification,

                    'man_cost' => (float) $calculation->man_cost,
                    'method_cost' => (float) $calculation->method_cost,
                    'material_cost' => (float) $calculation->material_cost,
                    'machine_cost' => (float) $calculation->machine_cost,

                    'total_cost' => (float) $calculation->toc,
                    'doc_variable' => (float) $calculation->doc_variable,
                    'doc_fixed' => (float) $calculation->doc_fixed,
                    'ioc' => (float) $calculation->ioc,

                    'raw_payload' => $calculation->raw_payload,
                ];
            });

        $summary = [
            'total_rows' => (clone $query)->count('ebitda_values.id'),
            'total_man_cost' => (float) (clone $query)->sum('ebitda_values.man_cost'),
            'total_method_cost' => (float) (clone $query)->sum('ebitda_values.method_cost'),
            'total_material_cost' => (float) (clone $query)->sum('ebitda_values.material_cost'),
            'total_machine_cost' => (float) (clone $query)->sum('ebitda_values.machine_cost'),
            'total_cost' => (float) (clone $query)->sum('ebitda_values.toc'),
            'total_doc_variable' => (float) (clone $query)->sum('ebitda_values.doc_variable'),
            'total_doc_fixed' => (float) (clone $query)->sum('ebitda_values.doc_fixed'),
            'total_ioc' => (float) (clone $query)->sum('ebitda_values.ioc'),
        ];

        $classifications = EbitdaValue::query()
            ->where('year', $year)
            ->where('scenario', $scenario)
            ->whereNotNull('classification')
            ->where('classification', '!=', '')
            ->select('classification')
            ->distinct()
            ->orderBy('classification')
            ->pluck('classification')
            ->values();

        return Inertia::render('Calculations/Index', [
            'calculations' => $calculations,
            'summary' => $summary,
            'classifications' => $classifications,
            'filters' => [
                'year' => $year,
                'scenario' => $scenario,
                'search' => $search,
                'classification' => $classification,
            ],
        ]);
    }
}
