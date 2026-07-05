<?php

namespace Database\Seeders;

use App\Models\EbitdaValue;
use App\Models\OrganizationCalculation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class EbitdaValueSeeder extends Seeder
{
    private int $year = 2026;

    private int $daysInYear = 365;

    /**
     * Isi manual revenue tahunan di sini jika sudah ada angka revenue dari tim.
     *
     * Untuk sementara, karena sheet Kalkulasi hanya berisi struktur cost,
     * revenue default = 0.
     *
     * Contoh:
     * '1.B.2' => 650000000000,
     * '1.B.3' => 200000000000,
     * '1.B.5' => 160500000000,
     */
    private array $annualRevenueTargetsByCode = [
        // '1.B.2' => 650000000000,
        // '1.B.3' => 200000000000,
        // '1.B.5' => 160500000000,
    ];

    public function run(): void
    {
        $calculations = OrganizationCalculation::query()
            ->with('organization')
            ->get();

        foreach ($calculations as $calculation) {
            $organization = $calculation->organization;

            if (! $organization) {
                continue;
            }

            $annualRevenue = (float) ($this->annualRevenueTargetsByCode[$organization->code] ?? 0);

            $this->seedScenario(
                calculation: $calculation,
                scenario: EbitdaValue::SCENARIO_TARGET_TAHUNAN,
                revenue: $annualRevenue,
                divisor: 1
            );

            $this->seedScenario(
                calculation: $calculation,
                scenario: EbitdaValue::SCENARIO_TARGET_HARIAN,
                revenue: $annualRevenue,
                divisor: $this->daysInYear
            );

            /**
             * Untuk sementara Plan Harian disamakan dengan Target Harian.
             * Nanti kalau sudah ada input plan harian, data ini bisa di-update dari form aplikasi.
             */
            $this->seedScenario(
                calculation: $calculation,
                scenario: EbitdaValue::SCENARIO_PLAN_HARIAN,
                revenue: $annualRevenue,
                divisor: $this->daysInYear
            );

            /**
             * Untuk sementara Aktual Harian disamakan dengan Target Harian.
             * Nanti kalau sudah ada input aktual harian, data ini bisa di-update dari form aplikasi.
             */
            $this->seedScenario(
                calculation: $calculation,
                scenario: EbitdaValue::SCENARIO_AKTUAL_HARIAN,
                revenue: $annualRevenue,
                divisor: $this->daysInYear
            );
        }
    }

    private function seedScenario(
        OrganizationCalculation $calculation,
        string $scenario,
        float $revenue,
        int $divisor
    ): void {
        $organization = $calculation->organization;

        if (! $organization) {
            return;
        }

        $manCost = $this->divide((float) $calculation->man_cost, $divisor);
        $methodCost = $this->divide((float) $calculation->method_cost, $divisor);
        $materialCost = $this->divide((float) $calculation->material_cost, $divisor);
        $machineCost = $this->divide((float) $calculation->machine_cost, $divisor);

        $docVariable = $this->divide((float) $calculation->doc_variable, $divisor);
        $docFixed = $this->divide((float) $calculation->doc_fixed, $divisor);
        $ioc = $this->divide((float) $calculation->ioc, $divisor);

        $tocFromDoc = $docVariable + $docFixed + $ioc;

        $totalCostFromCalculation = $this->divide((float) $calculation->total_cost, $divisor);

        /**
         * Prioritas utama: total_cost dari sheet Kalkulasi.
         * Fallback: DOC-V + DOC-F + IOC.
         */
        $toc = $totalCostFromCalculation > 0
            ? $totalCostFromCalculation
            : $tocFromDoc;

        $scenarioRevenue = $this->divide($revenue, $divisor);

        $ebitda = $scenarioRevenue - $toc;

        $ebitdaMargin = $scenarioRevenue > 0
            ? round(($ebitda / $scenarioRevenue) * 100, 4)
            : null;

        $payload = [
            'organization_id' => $organization->id,
            'period_date' => null,
            'year' => $this->year,
            'scenario' => $scenario,
        ];

        $values = [
            'excel_import_id' => null,
            'source_sheet' => 'Seeder from organization_calculations',
            'revenue' => $scenarioRevenue,
            'doc_variable' => $docVariable,
            'doc_fixed' => $docFixed,
            'ioc' => $ioc,
            'toc' => $toc,
            'ebitda' => $ebitda,
            'ebitda_margin' => $ebitdaMargin,
            'raw_payload' => [
                'source' => 'OrganizationCalculationSeeder',
                'organization_code' => $organization->code,
                'organization_name' => $organization->name,
                'scenario' => $scenario,
                'divisor' => $divisor,
                'annual_revenue' => $revenue,
                'toc_from_calculation' => $totalCostFromCalculation,
                'toc_from_doc' => $tocFromDoc,
                'validation' => [
                    'formula_toc_from_doc' => 'DOC-V + DOC-F + IOC',
                    'formula_ebitda' => 'Revenue - TOC',
                    'formula_margin' => 'EBITDA / Revenue',
                ],
            ],
        ];

        /**
         * Kolom tambahan ini hanya akan diisi jika Anda sudah menjalankan migration:
         * add_calculation_fields_to_ebitda_values_table
         */
        if (Schema::hasColumn('ebitda_values', 'classification')) {
            $values['classification'] = $calculation->classification;
        }

        if (Schema::hasColumn('ebitda_values', 'man_cost')) {
            $values['man_cost'] = $manCost;
        }

        if (Schema::hasColumn('ebitda_values', 'method_cost')) {
            $values['method_cost'] = $methodCost;
        }

        if (Schema::hasColumn('ebitda_values', 'material_cost')) {
            $values['material_cost'] = $materialCost;
        }

        if (Schema::hasColumn('ebitda_values', 'machine_cost')) {
            $values['machine_cost'] = $machineCost;
        }

        EbitdaValue::query()->updateOrCreate($payload, $values);
    }

    private function divide(float $value, int $divisor): float
    {
        if ($divisor <= 1) {
            return round($value, 2);
        }

        return round($value / $divisor, 2);
    }
}
