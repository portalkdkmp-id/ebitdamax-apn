<?php

namespace App\Services;

class EbitdaCostAlertService
{
    /**
     * @param  array<string, mixed>  $value
     * @return array{
     *     has_overrun: bool,
     *     severity: 'none'|'warning'|'danger',
     *     benchmark_toc: float,
     *     benchmark_label: string,
     *     components: array<int, array{
     *         key: string,
     *         label: string,
     *         value: float,
     *         benchmark_toc: float,
     *         overrun_amount: float,
     *         overrun_ratio: float|null
     *     }>,
     *     largest_component: string|null,
     *     largest_component_label: string|null,
     *     largest_cost_value: float,
     *     overrun_amount: float,
     *     overrun_ratio: float|null,
     *     message: string
     * }
     */
    public function analyze(array $value, ?float $benchmarkToc = null, string $benchmarkLabel = 'TOC'): array
    {
        $benchmarkToc = $benchmarkToc ?? (float) ($value['toc'] ?? 0);
        $comparisonToc = max($benchmarkToc, 0.0);

        $components = [
            [
                'key' => 'doc_variable',
                'label' => 'DOC-V',
                'value' => (float) ($value['doc_variable'] ?? 0),
            ],
            [
                'key' => 'doc_fixed',
                'label' => 'DOC-F',
                'value' => (float) ($value['doc_fixed'] ?? 0),
            ],
            [
                'key' => 'ioc',
                'label' => 'IOC',
                'value' => (float) ($value['ioc'] ?? 0),
            ],
        ];

        $overrunComponents = [];

        foreach ($components as $component) {
            if ($component['value'] <= $comparisonToc) {
                continue;
            }

            $overrunComponents[] = [
                'key' => $component['key'],
                'label' => $component['label'],
                'value' => $component['value'],
                'benchmark_toc' => $benchmarkToc,
                'overrun_amount' => $component['value'] - $comparisonToc,
                'overrun_ratio' => $comparisonToc > 0
                    ? round(($component['value'] / $comparisonToc) * 100, 2)
                    : null,
            ];
        }

        usort(
            $overrunComponents,
            fn (array $first, array $second): int => $second['overrun_amount'] <=> $first['overrun_amount']
        );

        $largestComponent = $overrunComponents[0] ?? null;

        if ($largestComponent === null) {
            return [
                'has_overrun' => false,
                'severity' => 'none',
                'benchmark_toc' => $benchmarkToc,
                'benchmark_label' => $benchmarkLabel,
                'components' => [],
                'largest_component' => null,
                'largest_component_label' => null,
                'largest_cost_value' => 0,
                'overrun_amount' => 0,
                'overrun_ratio' => null,
                'message' => 'Tidak ada komponen DOC/IOC yang melebihi TOC.',
            ];
        }

        $severity = (
            $largestComponent['overrun_ratio'] === null
            || $largestComponent['overrun_ratio'] >= 200
        )
            ? 'danger'
            : 'warning';

        return [
            'has_overrun' => true,
            'severity' => $severity,
            'benchmark_toc' => $benchmarkToc,
            'benchmark_label' => $benchmarkLabel,
            'components' => $overrunComponents,
            'largest_component' => $largestComponent['key'],
            'largest_component_label' => $largestComponent['label'],
            'largest_cost_value' => $largestComponent['value'],
            'overrun_amount' => $largestComponent['overrun_amount'],
            'overrun_ratio' => $largestComponent['overrun_ratio'],
            'message' => $this->buildMessage($largestComponent, $benchmarkToc, $benchmarkLabel),
        ];
    }

    /**
     * @param  array{label: string, value: float, overrun_amount: float, overrun_ratio: float|null}  $component
     */
    private function buildMessage(array $component, float $benchmarkToc, string $benchmarkLabel): string
    {
        if ($benchmarkToc <= 0) {
            return "{$component['label']} memiliki cost, sementara {$benchmarkLabel} belum terisi. Periksa alokasi biaya dan nilai TOC parent.";
        }

        $ratio = $component['overrun_ratio'] !== null
            ? number_format($component['overrun_ratio'], 2, ',', '.').'%'
            : 'N/A';

        return "{$component['label']} melebihi {$benchmarkLabel} ({$ratio} dari {$benchmarkLabel}). Indikasi area pemborosan perlu ditinjau.";
    }
}
