<?php

namespace App\Http\Controllers;

use App\Models\EbitdaValue;
use App\Models\Organization;
use App\Services\EbitdaOrganizationValueService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EbitdaTreeController extends Controller
{
    public function __construct(private EbitdaOrganizationValueService $organizationValueService) {}

    public function index(Request $request): Response
    {
        $year = (int) $request->input('year', now()->year);

        $scenario = $request->input(
            'scenario',
            EbitdaValue::SCENARIO_TARGET_TAHUNAN
        );

        $rootSlug = $request->input('root');

        $rootOrganization = $rootSlug
            ? Organization::query()->where('slug', $rootSlug)->first()
            : Organization::query()->where('code', '1')->first();

        if (! $rootOrganization) {
            $rootOrganization = Organization::query()->root()->firstOrFail();
        }

        $tree = $this->organizationValueService->buildTree($rootOrganization, $year, $scenario);

        $treeOptions = Organization::query()
            ->where(function ($query) {
                $query->whereNull('parent_id')
                    ->orWhere('level', 'Direktorat')
                    ->orWhere('level', 'Wakil Direktur Utama');
            })
            ->active()
            ->ordered()
            ->get()
            ->map(fn (Organization $organization) => [
                'id' => $organization->id,
                'slug' => $organization->slug,
                'code' => $organization->code,
                'name' => $organization->name,
                'level' => $organization->level,
            ]);

        return Inertia::render('EbitdaTree/Index', [
            'year' => $year,
            'scenario' => $scenario,
            'selectedRoot' => $rootOrganization->slug,
            'treeOptions' => $treeOptions,
            'tree' => $tree,
        ]);
    }
}
