<?php

use App\Models\EbitdaValue;
use App\Models\Organization;
use App\Models\User;
use Database\Seeders\OrganizationSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('calculations.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the calculations page', function () {
    $user = User::factory()->create();

    $this->seed(OrganizationSeeder::class);

    $organization = Organization::query()
        ->where('code', '1.B.1')
        ->firstOrFail();

    EbitdaValue::query()->create([
        'organization_id' => $organization->id,
        'year' => 2026,
        'period_date' => null,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Seeder from organization_calculations',
        'classification' => 'Governance',
        'revenue' => 0,
        'man_cost' => 1000000,
        'method_cost' => 2000000,
        'material_cost' => 3000000,
        'machine_cost' => 4000000,
        'toc' => 10000000,
        'doc_variable' => 5000000,
        'doc_fixed' => 3000000,
        'ioc' => 2000000,
        'ebitda' => -10000000,
        'ebitda_margin' => null,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('calculations.index', [
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'classification' => 'Governance',
    ]));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Calculations/Index')
            ->where('calculations.0.code', '1.B.1')
            ->where('calculations.0.name', 'SVP Corporate Secretary')
            ->where('calculations.0.year', 2026)
            ->where('calculations.0.scenario', EbitdaValue::SCENARIO_TARGET_TAHUNAN)
            ->where('calculations.0.classification', 'Governance')
            ->where('calculations.0.total_cost', 10000000)
            ->where('summary.total_rows', 1)
            ->where('summary.total_cost', 10000000)
            ->where('classifications.0', 'Governance')
            ->where('filters.year', 2026)
            ->where('filters.scenario', EbitdaValue::SCENARIO_TARGET_TAHUNAN)
            ->where('filters.classification', 'Governance')
        );
});

test('authenticated users can crud calculations through ebitda values', function () {
    $user = User::factory()->create();
    $csrfToken = 'test-token';

    $this->seed(OrganizationSeeder::class);

    $organization = Organization::query()
        ->where('code', '1.B.1')
        ->firstOrFail();

    $this->actingAs($user);

    $payload = [
        'organization_id' => $organization->id,
        'year' => 2026,
        'period_date' => null,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Manual Calculation CRUD',
        'classification' => 'Governance',
        'revenue' => 10000000,
        'man_cost' => 1000000,
        'method_cost' => 2000000,
        'material_cost' => 3000000,
        'machine_cost' => 4000000,
        'doc_variable' => 5000000,
        'doc_fixed' => 3000000,
        'ioc' => 2000000,
    ];

    $this->withSession(['_token' => $csrfToken])
        ->post(route('calculations.store'), [
            ...$payload,
            '_token' => $csrfToken,
        ])
        ->assertRedirect();

    $calculation = EbitdaValue::query()
        ->where('organization_id', $organization->id)
        ->firstOrFail();

    expect((float) $calculation->toc)->toBe(10000000.0)
        ->and((float) $calculation->ebitda)->toBe(0.0);

    $this->withSession(['_token' => $csrfToken])
        ->put(route('calculations.update', $calculation), [
            ...$payload,
            '_token' => $csrfToken,
            'revenue' => 15000000,
            'ioc' => 1000000,
        ])->assertRedirect();

    $calculation->refresh();

    expect((float) $calculation->toc)->toBe(9000000.0)
        ->and((float) $calculation->ebitda)->toBe(6000000.0);

    $this->withSession(['_token' => $csrfToken])
        ->delete(route('calculations.destroy', $calculation), [
            '_token' => $csrfToken,
        ])
        ->assertRedirect();

    $this->assertDatabaseMissing('ebitda_values', [
        'id' => $calculation->id,
    ]);
});

test('calculations page displays editable source rows and exposes parent rollup value', function () {
    $user = User::factory()->create();
    $csrfToken = 'test-token';

    $this->seed(OrganizationSeeder::class);

    $parent = Organization::query()
        ->where('code', '1.A')
        ->firstOrFail();
    $firstChild = Organization::query()
        ->where('code', '1.A.1')
        ->firstOrFail();
    $secondChild = Organization::query()
        ->where('code', '1.A.2')
        ->firstOrFail();

    $parentValue = EbitdaValue::query()->create([
        'organization_id' => $parent->id,
        'year' => 2026,
        'period_date' => null,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Parent exact row',
        'classification' => 'Parent',
        'revenue' => 999000000,
        'man_cost' => 0,
        'method_cost' => 0,
        'material_cost' => 0,
        'machine_cost' => 0,
        'doc_variable' => 0,
        'doc_fixed' => 0,
        'ioc' => 0,
        'toc' => 999000000,
        'ebitda' => 0,
        'ebitda_margin' => null,
    ]);
    EbitdaValue::query()->create([
        'organization_id' => $firstChild->id,
        'year' => 2026,
        'period_date' => null,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Child row',
        'classification' => 'Child',
        'revenue' => 100000000,
        'man_cost' => 1000000,
        'method_cost' => 2000000,
        'material_cost' => 3000000,
        'machine_cost' => 4000000,
        'doc_variable' => 10000000,
        'doc_fixed' => 5000000,
        'ioc' => 5000000,
        'toc' => 20000000,
        'ebitda' => 80000000,
        'ebitda_margin' => 80,
    ]);
    EbitdaValue::query()->create([
        'organization_id' => $secondChild->id,
        'year' => 2026,
        'period_date' => null,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
        'source_sheet' => 'Child row',
        'classification' => 'Child',
        'revenue' => 50000000,
        'man_cost' => 2000000,
        'method_cost' => 3000000,
        'material_cost' => 4000000,
        'machine_cost' => 5000000,
        'doc_variable' => 5000000,
        'doc_fixed' => 5000000,
        'ioc' => 0,
        'toc' => 10000000,
        'ebitda' => 40000000,
        'ebitda_margin' => 80,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('calculations.index', [
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
    ]));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('calculations.0.code', '1.A')
            ->where('calculations.0.value_source', 'calculated_from_children')
            ->where('calculations.0.revenue', 999000000)
            ->where('calculations.0.total_cost', 999000000)
            ->where('calculations.0.doc_variable', 0)
            ->where('calculations.0.doc_fixed', 0)
            ->where('calculations.0.ioc', 0)
            ->where('calculations.0.ebitda', 0)
            ->where('calculations.0.ebitda_margin', null)
            ->where('calculations.0.resolved_value.revenue', 150000000)
            ->where('calculations.0.resolved_value.toc', 30000000)
            ->where('calculations.0.resolved_value.ebitda', 120000000)
            ->where('calculations.0.resolved_value.ebitda_margin', 80)
        );

    $this->withSession(['_token' => $csrfToken])
        ->put(route('calculations.update', $parentValue), [
            '_token' => $csrfToken,
            'organization_id' => $parent->id,
            'year' => 2026,
            'period_date' => null,
            'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
            'source_sheet' => 'Parent exact row',
            'classification' => 'Parent',
            'revenue' => 123000000,
            'man_cost' => 1000000,
            'method_cost' => 2000000,
            'material_cost' => 3000000,
            'machine_cost' => 4000000,
            'doc_variable' => 10000000,
            'doc_fixed' => 5000000,
            'ioc' => 5000000,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $response = $this->get(route('calculations.index', [
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
    ]));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('calculations.0.code', '1.A')
            ->where('calculations.0.revenue', 123000000)
            ->where('calculations.0.total_cost', 20000000)
            ->where('calculations.0.doc_variable', 10000000)
            ->where('calculations.0.doc_fixed', 5000000)
            ->where('calculations.0.ioc', 5000000)
            ->where('calculations.0.ebitda', 103000000)
            ->where('calculations.0.ebitda_margin', 83.7398)
            ->where('calculations.0.resolved_value.revenue', 150000000)
            ->where('calculations.0.resolved_value.toc', 30000000)
        );
});
