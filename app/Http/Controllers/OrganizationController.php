<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrganizationRequest;
use App\Http\Requests\UpdateOrganizationRequest;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    public function index(): Response
    {
        $organizations = Organization::query()
            ->with('parent')
            ->ordered()
            ->get()
            ->map(fn (Organization $organization) => [
                'id' => $organization->id,
                'parent_id' => $organization->parent_id,
                'parent_name' => $organization->parent?->name,
                'code' => $organization->code,
                'name' => $organization->name,
                'slug' => $organization->slug,
                'level' => $organization->level,
                'node_type' => $organization->node_type,
                'directorate_group' => $organization->directorate_group,
                'is_revenue_center' => $organization->is_revenue_center,
                'is_cost_center' => $organization->is_cost_center,
                'is_active' => $organization->is_active,
                'sort_order' => $organization->sort_order,
            ]);

        $parents = Organization::query()
            ->active()
            ->ordered()
            ->get(['id', 'code', 'name', 'level']);

        $summary = [
            'total_nodes' => Organization::query()->count(),
            'active_nodes' => Organization::query()->where('is_active', true)->count(),
            'revenue_centers' => Organization::query()->where('is_revenue_center', true)->count(),
            'cost_centers' => Organization::query()->where('is_cost_center', true)->count(),
        ];

        return Inertia::render('Organizations/Index', [
            'organizations' => $organizations,
            'parents' => $parents,
            'summary' => $summary,
        ]);
    }

    public function store(StoreOrganizationRequest $request): RedirectResponse
    {
        $payload = $this->prepareOrganizationPayload($request->validated());

        Organization::query()->create($payload);

        return back()->with('success', 'Organisasi berhasil ditambahkan.');
    }

    public function update(
        UpdateOrganizationRequest $request,
        Organization $organization
    ): RedirectResponse {
        $payload = $this->prepareOrganizationPayload($request->validated(), $organization);

        $organization->update($payload);

        return back()->with('success', 'Organisasi berhasil diperbarui.');
    }

    public function destroy(Organization $organization): RedirectResponse
    {
        $organization->update([
            'is_active' => false,
        ]);

        return back()->with('success', 'Organisasi berhasil dinonaktifkan.');
    }

    private function prepareOrganizationPayload(array $payload, ?Organization $organization = null): array
    {
        $parent = isset($payload['parent_id']) && $payload['parent_id']
            ? Organization::query()->find($payload['parent_id'])
            : null;

        $depth = $parent ? $parent->depth + 1 : 0;
        $path = $parent ? $parent->path . '/' . $payload['code'] : $payload['code'];

        $payload['slug'] = Str::slug($payload['code'] . '-' . $payload['name']);
        $payload['depth'] = $depth;
        $payload['path'] = $path;
        $payload['sort_order'] = $payload['sort_order'] ?? 0;

        return $payload;
    }
}