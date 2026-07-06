<?php

use App\Models\EbitdaValue;
use App\Models\Organization;
use App\Models\User;
use App\Services\EbitdaDashboardService;
use Database\Seeders\EbitdaValueSeeder;
use Database\Seeders\OrganizationCalculationSeeder;
use Database\Seeders\OrganizationSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->seed(OrganizationSeeder::class);

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Index')
            ->where('directorates.0.code', '1.A.1')
            ->where('directorates.0.name', 'Direktur Perencanaan dan Pengembangan Bisnis')
            ->where('tree.code', '1')
            ->has('tree.children', 19)
            ->where('tree.children.0.code', '1.A.1')
            ->where('tree.children.18.code', '1.C.6')
        );
});

test('directorate dashboard parent values are calculated from child values', function () {
    $this->seed(OrganizationSeeder::class);
    $this->seed(OrganizationCalculationSeeder::class);
    $this->seed(EbitdaValueSeeder::class);

    $directorate = Organization::query()
        ->where('code', '1.A.3')
        ->firstOrFail();
    $leaf = Organization::query()
        ->where('code', '1.A.3.1.1')
        ->firstOrFail();
    $leafSourceValue = EbitdaValue::query()
        ->where('organization_id', $leaf->id)
        ->where('year', 2026)
        ->where('scenario', EbitdaValue::SCENARIO_TARGET_TAHUNAN)
        ->firstOrFail();

    $dashboard = app(EbitdaDashboardService::class)->directorateDashboard(
        $directorate,
        2026,
        EbitdaValue::SCENARIO_TARGET_TAHUNAN
    );

    $costBreakdownTotal = array_sum(array_column($dashboard['charts']['cost_breakdown'], 'value'));
    $firstChild = collect($dashboard['tree']['children'])
        ->firstWhere('code', '1.A.3.1');
    $firstChildValues = array_column($firstChild['children'], 'value');
    $leafNode = collect($firstChild['children'])
        ->firstWhere('code', '1.A.3.1.1');
    $childValues = array_column($dashboard['tree']['children'], 'value');

    expect($dashboard['tree']['value_source'])->toBe('calculated_from_children')
        ->and($dashboard['tree']['value']['toc'])->toBe(array_sum(array_column($childValues, 'toc')))
        ->and($dashboard['tree']['value']['ebitda'])->toBe(array_sum(array_column($childValues, 'ebitda')))
        ->and($dashboard['summary']['toc'])->toBe($costBreakdownTotal)
        ->and($firstChild['value_source'])->toBe('calculated_from_children')
        ->and($firstChild['value']['toc'])->toBe(array_sum(array_column($firstChildValues, 'toc')))
        ->and($leafNode['value_source'])->toBe('excel')
        ->and($leafNode['value']['toc'])->toBe((float) $leafSourceValue->toc)
        ->and($leafNode['value']['ebitda'])->toBe((float) $leafSourceValue->ebitda);
});

test('dashboard cost alerts flag doc or ioc costs that exceed toc', function () {
    $this->seed(OrganizationSeeder::class);

    $directorate = Organization::query()
        ->where('code', '1.A.3')
        ->firstOrFail();
    $sibling = Organization::query()
        ->where('code', '1.A.4')
        ->firstOrFail();

    EbitdaValue::query()->create([
        'organization_id' => $directorate->id,
        'period_date' => null,
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Feature test',
        'revenue' => 0,
        'doc_variable' => 2_500_000,
        'doc_fixed' => 500_000,
        'ioc' => 250_000,
        'toc' => 1_000_000,
        'ebitda' => -1_000_000,
        'ebitda_margin' => null,
    ]);
    EbitdaValue::query()->create([
        'organization_id' => $sibling->id,
        'period_date' => null,
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Feature test',
        'revenue' => 0,
        'doc_variable' => 0,
        'doc_fixed' => 0,
        'ioc' => 0,
        'toc' => 1_000_000,
        'ebitda' => -1_000_000,
        'ebitda_margin' => null,
    ]);

    $dashboard = app(EbitdaDashboardService::class)->executiveDashboard(
        2026,
        EbitdaValue::SCENARIO_TARGET_TAHUNAN
    );

    $alert = collect($dashboard['alerts']['negative_ebitda'])
        ->firstWhere('code', '1.A.3');

    expect($alert)->not->toBeNull()
        ->and($alert['largest_component'])->toBe('doc_variable')
        ->and($alert['largest_component_label'])->toBe('DOC-V')
        ->and($alert['benchmark_toc'])->toBe(2_000_000.0)
        ->and($alert['overrun_amount'])->toBe(500_000.0)
        ->and(collect($alert['overrun_components'])->pluck('key')->all())->toContain('doc_variable');
});

test('executive dashboard summary and charts stay aligned with organization table rows', function () {
    $this->seed(OrganizationSeeder::class);
    $this->seed(OrganizationCalculationSeeder::class);
    $this->seed(EbitdaValueSeeder::class);

    $dashboard = app(EbitdaDashboardService::class)->executiveDashboard(
        2026,
        EbitdaValue::SCENARIO_TARGET_TAHUNAN
    );

    $directorates = collect($dashboard['directorates']);
    $tableValues = $directorates->pluck('value');
    $tableCodes = $directorates->pluck('code')->all();

    expect($dashboard['summary']['revenue'])->toBe(array_sum(array_column($tableValues->all(), 'revenue')))
        ->and($dashboard['summary']['toc'])->toBe(array_sum(array_column($tableValues->all(), 'toc')))
        ->and($dashboard['summary']['ebitda'])->toBe(array_sum(array_column($tableValues->all(), 'ebitda')))
        ->and($dashboard['tree']['value'])->toBe($dashboard['summary'])
        ->and(array_column($dashboard['tree']['children'], 'code'))->toBe($tableCodes)
        ->and(array_column($dashboard['charts']['revenue_by_directorate'], 'code'))->toBe($tableCodes)
        ->and(array_column($dashboard['charts']['ebitda_by_directorate'], 'code'))->toBe($tableCodes);
});

test('dashboard cost alerts use parent toc as the benchmark', function () {
    $this->seed(OrganizationSeeder::class);

    $parent = Organization::query()
        ->where('code', '1.A')
        ->firstOrFail();
    $child = Organization::query()
        ->where('code', '1.A.3')
        ->firstOrFail();
    $sibling = Organization::query()
        ->where('code', '1.A.4')
        ->firstOrFail();

    EbitdaValue::query()->create([
        'organization_id' => $parent->id,
        'period_date' => null,
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Feature test',
        'revenue' => 0,
        'doc_variable' => 0,
        'doc_fixed' => 0,
        'ioc' => 0,
        'toc' => 10_000_000,
        'ebitda' => -10_000_000,
        'ebitda_margin' => null,
    ]);
    EbitdaValue::query()->create([
        'organization_id' => $child->id,
        'period_date' => null,
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Feature test',
        'revenue' => 0,
        'doc_variable' => 1_500_000,
        'doc_fixed' => 0,
        'ioc' => 0,
        'toc' => 1_000_000,
        'ebitda' => -1_000_000,
        'ebitda_margin' => null,
    ]);
    EbitdaValue::query()->create([
        'organization_id' => $sibling->id,
        'period_date' => null,
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Feature test',
        'revenue' => 0,
        'doc_variable' => 0,
        'doc_fixed' => 0,
        'ioc' => 0,
        'toc' => 1_000_000,
        'ebitda' => -1_000_000,
        'ebitda_margin' => null,
    ]);

    $dashboard = app(EbitdaDashboardService::class)->executiveDashboard(
        2026,
        EbitdaValue::SCENARIO_TARGET_TAHUNAN
    );

    $alert = collect($dashboard['alerts']['negative_ebitda'])
        ->firstWhere('code', '1.A.3');

    expect($alert)->toBeNull();
});

test('executive dashboard rollup uses a bounded number of queries', function () {
    $this->seed(OrganizationSeeder::class);
    $this->seed(OrganizationCalculationSeeder::class);
    $this->seed(EbitdaValueSeeder::class);

    DB::flushQueryLog();
    DB::enableQueryLog();

    app(EbitdaDashboardService::class)->executiveDashboard(
        2026,
        EbitdaValue::SCENARIO_TARGET_TAHUNAN
    );

    expect(count(DB::getQueryLog()))->toBeLessThan(12);
});
