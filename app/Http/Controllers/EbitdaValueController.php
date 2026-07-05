<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEbitdaValueRequest;
use App\Http\Requests\UpdateEbitdaValueRequest;
use App\Models\EbitdaValue;
use App\Models\Organization;
use App\Services\EbitdaFormulaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EbitdaValueController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $year = $request->input('year', now()->year);
        $scenario = $request->input('scenario', 'target_tahunan');

        $values = EbitdaValue::query()
            ->with('organization')
            ->when($search !== '', function ($query) use ($search) {
                $query->whereHas('organization', function ($subQuery) use ($search) {
                    $subQuery
                        ->where('code', 'ilike', "%{$search}%")
                        ->orWhere('name', 'ilike', "%{$search}%")
                        ->orWhere('level', 'ilike', "%{$search}%");
                });
            })
            ->when($year, fn ($query) => $query->where('year', $year))
            ->when($scenario, fn ($query) => $query->where('scenario', $scenario))
            ->join('organizations', 'organizations.id', '=', 'ebitda_values.organization_id')
            ->select('ebitda_values.*')
            ->orderBy('organizations.sort_order')
            ->paginate(25)
            ->withQueryString();

        $organizations = Organization::query()
            ->active()
            ->ordered()
            ->get(['id', 'code', 'name', 'level']);

        return Inertia::render('EbitdaValues/Index', [
            'values' => $values,
            'organizations' => $organizations,
            'filters' => [
                'search' => $search,
                'year' => (int) $year,
                'scenario' => $scenario,
            ],
        ]);
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

        return back()->with('success', 'Data EBITDA berhasil disimpan.');
    }

    public function update(
        UpdateEbitdaValueRequest $request,
        EbitdaValue $ebitdaValue,
        EbitdaFormulaService $formulaService
    ): RedirectResponse {
        $payload = $formulaService->calculateFromPayload($request->validated());

        $ebitdaValue->update($payload);

        return back()->with('success', 'Data EBITDA berhasil diperbarui.');
    }

    public function destroy(EbitdaValue $ebitdaValue): RedirectResponse
    {
        $ebitdaValue->delete();

        return back()->with('success', 'Data EBITDA berhasil dihapus.');
    }
}