<?php

namespace App\Services;

use App\Models\EbitdaValue;
use App\Models\Organization;

class EbitdaOrganizationValueService
{
    public function __construct(private EbitdaCostAlertService $costAlertService) {}

    /**
     * @var array<int, array<int, Organization>>
     */
    private array $childrenByParentId = [];

    private bool $childrenLoaded = false;

    /**
     * @var array<string, array<int, array<string, float|null>>>
     */
    private array $exactValuesByPeriod = [];

    /**
     * @var array<string, array<int, array{source: 'excel'|'calculated_from_children'|'empty', value: array<string, float|null>}>>
     */
    private array $resolvedValuesByPeriod = [];

    /**
     * @return array{source: 'excel'|'calculated_from_children'|'empty', value: array<string, float|null>}
     */
    public function resolve(Organization $organization, int $year, string $scenario): array
    {
        return $this->resolveOrganization($organization, $year, $scenario);
    }

    /**
     * @param  array<int, true>  $visited
     * @return array{source: 'excel'|'calculated_from_children'|'empty', value: array<string, float|null>}
     */
    private function resolveOrganization(Organization $organization, int $year, string $scenario, array $visited = []): array
    {
        $periodKey = $this->periodKey($year, $scenario);
        $organizationId = (int) $organization->id;

        if (isset($this->resolvedValuesByPeriod[$periodKey][$organizationId])) {
            return $this->resolvedValuesByPeriod[$periodKey][$organizationId];
        }

        if (isset($visited[$organizationId])) {
            return [
                'source' => 'empty',
                'value' => $this->emptyValue(),
            ];
        }

        $visited[$organizationId] = true;

        $childValues = [];

        foreach ($this->childrenFor($organization) as $child) {
            $childValues[] = $this->resolveOrganization($child, $year, $scenario, $visited)['value'];
        }

        if (count($childValues) > 0) {
            $sum = $this->sumValues($childValues);

            if ($this->hasAnyValue($sum)) {
                return $this->resolvedValuesByPeriod[$periodKey][$organizationId] = [
                    'source' => 'calculated_from_children',
                    'value' => $sum,
                ];
            }
        }

        $exactValue = $this->getExactValue($organization, $year, $scenario);

        if ($exactValue !== null) {
            return $this->resolvedValuesByPeriod[$periodKey][$organizationId] = [
                'source' => 'excel',
                'value' => $exactValue,
            ];
        }

        return $this->resolvedValuesByPeriod[$periodKey][$organizationId] = [
            'source' => 'empty',
            'value' => $this->emptyValue(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function buildTree(Organization $organization, int $year, string $scenario, ?array $parentValue = null, ?string $parentCode = null, array $visited = []): array
    {
        $organizationId = (int) $organization->id;

        if (isset($visited[$organizationId])) {
            $resolvedValue = [
                'source' => 'empty',
                'value' => $this->emptyValue(),
            ];

            return $this->treeNode(
                organization: $organization,
                resolvedValue: $resolvedValue,
                children: [],
                parentValue: $parentValue,
                parentCode: $parentCode
            );
        }

        $visited[$organizationId] = true;

        $children = [];

        foreach ($this->childrenFor($organization) as $child) {
            $children[] = $this->buildTree($child, $year, $scenario, visited: $visited);
        }

        $resolvedValue = $this->resolveFromPreparedChildren(
            organization: $organization,
            year: $year,
            scenario: $scenario,
            childValues: array_column($children, 'value')
        );

        $children = array_map(
            fn (array $child): array => $this->withParentCostAlert($child, $resolvedValue['value'], $organization->code),
            $children
        );

        return $this->treeNode(
            organization: $organization,
            resolvedValue: $resolvedValue,
            children: $children,
            parentValue: $parentValue,
            parentCode: $parentCode
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $values
     * @return array<string, float|null>
     */
    public function sumValues(array $values): array
    {
        $revenue = array_sum(array_column($values, 'revenue'));
        $docVariable = array_sum(array_column($values, 'doc_variable'));
        $docFixed = array_sum(array_column($values, 'doc_fixed'));
        $ioc = array_sum(array_column($values, 'ioc'));
        $toc = array_sum(array_column($values, 'toc'));
        $ebitda = array_sum(array_column($values, 'ebitda'));

        return [
            'revenue' => $revenue,
            'doc_variable' => $docVariable,
            'doc_fixed' => $docFixed,
            'ioc' => $ioc,
            'toc' => $toc,
            'ebitda' => $ebitda,
            'ebitda_margin' => $revenue > 0 ? round(($ebitda / $revenue) * 100, 4) : null,
        ];
    }

    /**
     * @return array<string, float|null>|null
     */
    public function getExactValue(Organization $organization, int $year, string $scenario): ?array
    {
        $periodKey = $this->periodKey($year, $scenario);

        if (! isset($this->exactValuesByPeriod[$periodKey])) {
            $values = [];

            EbitdaValue::query()
                ->where('year', $year)
                ->where('scenario', $scenario)
                ->orderBy('id')
                ->get()
                ->each(function (EbitdaValue $row) use (&$values): void {
                    $organizationId = (int) $row->organization_id;

                    if (array_key_exists($organizationId, $values)) {
                        return;
                    }

                    $values[$organizationId] = $this->valueFromRow($row);
                });

            $this->exactValuesByPeriod[$periodKey] = $values;
        }

        return $this->exactValuesByPeriod[$periodKey][(int) $organization->id] ?? null;
    }

    /**
     * @return array<string, float|null>
     */
    public function valueFromRow(EbitdaValue $row): array
    {
        return [
            'revenue' => (float) $row->revenue,
            'doc_variable' => (float) $row->doc_variable,
            'doc_fixed' => (float) $row->doc_fixed,
            'ioc' => (float) $row->ioc,
            'toc' => (float) $row->toc,
            'ebitda' => (float) $row->ebitda,
            'ebitda_margin' => $row->ebitda_margin !== null ? (float) $row->ebitda_margin : null,
        ];
    }

    /**
     * @return array<string, float|null>
     */
    public function emptyValue(): array
    {
        return [
            'revenue' => 0,
            'doc_variable' => 0,
            'doc_fixed' => 0,
            'ioc' => 0,
            'toc' => 0,
            'ebitda' => 0,
            'ebitda_margin' => null,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $childValues
     * @return array{source: 'excel'|'calculated_from_children'|'empty', value: array<string, float|null>}
     */
    private function resolveFromPreparedChildren(Organization $organization, int $year, string $scenario, array $childValues): array
    {
        if (count($childValues) > 0) {
            $sum = $this->sumValues($childValues);

            if ($this->hasAnyValue($sum)) {
                return [
                    'source' => 'calculated_from_children',
                    'value' => $sum,
                ];
            }
        }

        $exactValue = $this->getExactValue($organization, $year, $scenario);

        if ($exactValue !== null) {
            return [
                'source' => 'excel',
                'value' => $exactValue,
            ];
        }

        return [
            'source' => 'empty',
            'value' => $this->emptyValue(),
        ];
    }

    /**
     * @param  array<string, mixed>  $node
     * @param  array<string, mixed>  $parentValue
     * @return array<string, mixed>
     */
    private function withParentCostAlert(array $node, array $parentValue, string $parentCode): array
    {
        $node['cost_alert'] = $this->costAlertService->analyze(
            value: $node['value'],
            benchmarkToc: (float) ($parentValue['toc'] ?? 0),
            benchmarkLabel: "TOC parent {$parentCode}"
        );

        return $node;
    }

    /**
     * @return array<int, Organization>
     */
    private function childrenFor(Organization $organization): array
    {
        $this->loadOrganizationChildren();

        return $this->childrenByParentId[(int) $organization->id] ?? [];
    }

    private function loadOrganizationChildren(): void
    {
        if ($this->childrenLoaded) {
            return;
        }

        $this->childrenByParentId = [];

        Organization::query()
            ->active()
            ->ordered()
            ->get()
            ->each(function (Organization $organization): void {
                if ($organization->parent_id === null) {
                    return;
                }

                $this->childrenByParentId[(int) $organization->parent_id][] = $organization;
            });

        $this->childrenLoaded = true;
    }

    /**
     * @param  array{source: 'excel'|'calculated_from_children'|'empty', value: array<string, float|null>}  $resolvedValue
     * @param  array<int, array<string, mixed>>  $children
     * @param  array<string, mixed>|null  $parentValue
     * @return array<string, mixed>
     */
    private function treeNode(Organization $organization, array $resolvedValue, array $children, ?array $parentValue, ?string $parentCode): array
    {
        return [
            'id' => $organization->id,
            'slug' => $organization->slug,
            'code' => $organization->code,
            'name' => $organization->name,
            'level' => $organization->level,
            'node_type' => $organization->node_type,
            'directorate_group' => $organization->directorate_group,
            'is_revenue_center' => $organization->is_revenue_center,
            'is_cost_center' => $organization->is_cost_center,
            'depth' => $organization->depth,
            'value_source' => $resolvedValue['source'],
            'value' => $resolvedValue['value'],
            'cost_alert' => $this->costAlertService->analyze(
                value: $resolvedValue['value'],
                benchmarkToc: $parentValue['toc'] ?? $resolvedValue['value']['toc'],
                benchmarkLabel: $parentCode ? "TOC parent {$parentCode}" : 'TOC node'
            ),
            'children' => $children,
        ];
    }

    private function periodKey(int $year, string $scenario): string
    {
        return "{$year}:{$scenario}";
    }

    /**
     * @param  array<string, mixed>  $value
     */
    public function hasAnyValue(array $value): bool
    {
        foreach (['revenue', 'doc_variable', 'doc_fixed', 'ioc', 'toc', 'ebitda'] as $key) {
            if (abs((float) ($value[$key] ?? 0)) > 0) {
                return true;
            }
        }

        return $value['ebitda_margin'] !== null;
    }
}
