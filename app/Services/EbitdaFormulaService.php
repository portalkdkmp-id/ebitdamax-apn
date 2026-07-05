<?php

namespace App\Services;

class EbitdaFormulaService
{
    public function calculateToc(float $docVariable, float $docFixed, float $ioc): float
    {
        return round($docVariable + $docFixed + $ioc, 2);
    }

    public function calculateEbitda(float $revenue, float $toc): float
    {
        return round($revenue - $toc, 2);
    }

    public function calculateMargin(float $revenue, float $ebitda): ?float
    {
        if ($revenue <= 0) {
            return null;
        }

        return round(($ebitda / $revenue) * 100, 4);
    }

    public function calculateFromPayload(array $payload): array
    {
        $revenue = (float) ($payload['revenue'] ?? 0);
        $docVariable = (float) ($payload['doc_variable'] ?? 0);
        $docFixed = (float) ($payload['doc_fixed'] ?? 0);
        $ioc = (float) ($payload['ioc'] ?? 0);

        $toc = $this->calculateToc($docVariable, $docFixed, $ioc);
        $ebitda = $this->calculateEbitda($revenue, $toc);
        $margin = $this->calculateMargin($revenue, $ebitda);

        return array_merge($payload, [
            'revenue' => $revenue,
            'doc_variable' => $docVariable,
            'doc_fixed' => $docFixed,
            'ioc' => $ioc,
            'toc' => $toc,
            'ebitda' => $ebitda,
            'ebitda_margin' => $margin,
        ]);
    }
}