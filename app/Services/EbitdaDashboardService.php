<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Support\Collection;

class EbitdaDashboardService
{
    public function __construct(
        private EbitdaOrganizationValueService $organizationValueService
    ) {}

    public function executiveDashboard(int $year, string $scenario): array
    {
        $fullTree = $this->rootDashboardTree($year, $scenario);

        $directorates = Organization::query()
            ->dashboardUnits()
            ->active()
            ->ordered()
            ->get()
            ->map(function (Organization $organization) use ($year, $scenario) {
                $resolvedValue = $this->organizationValueService->resolve($organization, $year, $scenario);

                return [
                    'id' => $organization->id,
                    'slug' => $organization->slug,
                    'code' => $organization->code,
                    'name' => $organization->name,
                    'level' => $organization->level,
                    'is_revenue_center' => $organization->is_revenue_center,
                    'is_cost_center' => $organization->is_cost_center,
                    'value_source' => $resolvedValue['source'],
                    'value' => $resolvedValue['value'],
                ];
            })
            ->values();

        $summary = $this->organizationValueService->sumValues($directorates->pluck('value')->all());
        $dashboardTree = $this->dashboardUnitsTree($fullTree, $directorates, $summary);

        return [
            'year' => $year,
            'scenario' => $scenario,
            'summary' => $summary,
            'directorates' => $directorates,
            'tree' => $dashboardTree,
            'charts' => [
                'revenue_by_directorate' => $this->buildRevenueChart($directorates),
                'cost_breakdown' => $this->buildCostBreakdownChart($summary),
                'ebitda_by_directorate' => $this->buildEbitdaChart($directorates),
                'margin_ranking' => $this->buildMarginRanking($directorates),
            ],
            'alerts' => [
                'negative_ebitda' => $fullTree
                    ? $this->costOverrunAlertsFromNodes(collect($this->flattenTree($fullTree)))
                    : [],
            ],
        ];
    }

    public function directorateDashboard(Organization $organization, int $year, string $scenario): array
    {
        $tree = $this->organizationValueService->buildTree($organization, $year, $scenario);
        $flatNodes = collect($this->flattenTree($tree));
        $children = collect($tree['children']);

        $summary = $tree['value'];

        return [
            'year' => $year,
            'scenario' => $scenario,
            'directorate' => [
                'id' => $organization->id,
                'slug' => $organization->slug,
                'code' => $organization->code,
                'name' => $organization->name,
            ],
            'summary' => $summary,
            'tree' => $tree,
            'charts' => [
                'revenue_by_directorate' => $this->buildRevenueChart($children),
                'cost_breakdown' => $this->buildCostBreakdownChart($summary),
                'ebitda_by_directorate' => $this->buildEbitdaChart($children),
                'margin_ranking' => $this->buildMarginRanking($flatNodes),
            ],
            'alerts' => [
                'negative_ebitda' => $this->costOverrunAlertsFromNodes($flatNodes),
            ],
        ];
    }

    private function flattenTree(array $node): array
    {
        $nodes = [$node];

        foreach ($node['children'] ?? [] as $child) {
            $nodes = array_merge($nodes, $this->flattenTree($child));
        }

        return $nodes;
    }

    private function buildRevenueChart(Collection $items): array
    {
        return $items
            ->map(fn ($item) => [
                'code' => $item['code'],
                'name' => $item['name'],
                'label' => $item['code'],
                'value' => (float) $item['value']['revenue'],
            ])
            ->values()
            ->all();
    }

    private function buildEbitdaChart(Collection $items): array
    {
        return $items
            ->map(fn ($item) => [
                'code' => $item['code'],
                'name' => $item['name'],
                'label' => $item['code'],
                'value' => (float) $item['value']['ebitda'],
            ])
            ->values()
            ->all();
    }

    private function buildCostBreakdownChart(array $summary): array
    {
        return [
            [
                'name' => 'DOC-V',
                'label' => 'DOC Variable',
                'value' => (float) $summary['doc_variable'],
            ],
            [
                'name' => 'DOC-F',
                'label' => 'DOC Fixed',
                'value' => (float) $summary['doc_fixed'],
            ],
            [
                'name' => 'IOC',
                'label' => 'Indirect Operating Cost',
                'value' => (float) $summary['ioc'],
            ],
        ];
    }

    private function buildMarginRanking(Collection $items): array
    {
        return $items
            ->filter(fn ($item) => $item['value']['ebitda_margin'] !== null)
            ->map(fn ($item) => [
                'code' => $item['code'],
                'name' => $item['name'],
                'label' => $item['code'],
                'value' => (float) $item['value']['ebitda_margin'],
            ])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    private function rootDashboardTree(int $year, string $scenario): ?array
    {
        $rootOrganization = Organization::query()
            ->where('code', '1')
            ->first()
            ?? Organization::query()->root()->first();

        if (! $rootOrganization) {
            return null;
        }

        return $this->organizationValueService->buildTree($rootOrganization, $year, $scenario);
    }

    private function dashboardUnitsTree(?array $rootTree, Collection $directorates, array $summary): ?array
    {
        if (! $rootTree) {
            return null;
        }

        $nodesById = collect($this->flattenTree($rootTree))
            ->keyBy('id');

        $children = $directorates
            ->map(function (array $directorate) use ($nodesById, $rootTree): array {
                $node = $nodesById->get($directorate['id'], [
                    'id' => $directorate['id'],
                    'slug' => $directorate['slug'],
                    'code' => $directorate['code'],
                    'name' => $directorate['name'],
                    'level' => $directorate['level'],
                    'node_type' => null,
                    'directorate_group' => null,
                    'is_revenue_center' => $directorate['is_revenue_center'],
                    'is_cost_center' => $directorate['is_cost_center'],
                    'depth' => 1,
                    'value_source' => $directorate['value_source'],
                    'value' => $directorate['value'],
                    'cost_alert' => $rootTree['cost_alert'],
                ]);

                $node['children'] = [];

                return $node;
            })
            ->values()
            ->all();

        $rootTree['value_source'] = 'calculated_from_children';
        $rootTree['value'] = $summary;
        $rootTree['children'] = $children;

        return $rootTree;
    }

    private function costOverrunAlertsFromNodes(Collection $nodes): array
    {
        return $nodes
            ->map(function ($node): ?array {
                $alert = $node['cost_alert'];

                if (! $alert['has_overrun']) {
                    return null;
                }

                return $this->formatCostOverrunAlert([
                    'organization_id' => $node['id'],
                    'code' => $node['code'],
                    'name' => $node['name'],
                    'level' => $node['level'],
                ], $node['value'], $alert);
            })
            ->filter()
            ->sortByDesc('overrun_amount')
            ->take(15)
            ->values()
            ->all();
    }

    private function formatCostOverrunAlert(array $node, array $value, array $alert): array
    {
        return [
            'organization_id' => $node['organization_id'],
            'code' => $node['code'],
            'name' => $node['name'],
            'level' => $node['level'],
            'revenue' => (float) $value['revenue'],
            'doc_variable' => (float) $value['doc_variable'],
            'doc_fixed' => (float) $value['doc_fixed'],
            'ioc' => (float) $value['ioc'],
            'toc' => (float) $value['toc'],
            'ebitda' => (float) $value['ebitda'],
            'ebitda_margin' => $value['ebitda_margin'],
            'overrun_components' => $alert['components'],
            'benchmark_toc' => $alert['benchmark_toc'],
            'benchmark_label' => $alert['benchmark_label'],
            'largest_component' => $alert['largest_component'],
            'largest_component_label' => $alert['largest_component_label'],
            'largest_cost_value' => $alert['largest_cost_value'],
            'overrun_amount' => $alert['overrun_amount'],
            'overrun_ratio' => $alert['overrun_ratio'],
            'severity' => $alert['severity'],
            'analysis' => $alert['message'],
        ];
    }
}
