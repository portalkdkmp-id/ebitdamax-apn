<?php

use App\Models\EbitdaValue;
use App\Models\Organization;
use App\Models\User;
use Database\Seeders\OrganizationSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated users can visit the ebitda values page', function () {
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
        'source_sheet' => 'Manual CRUD',
        'classification' => 'Governance',
        'revenue' => 15000000,
        'doc_variable' => 5000000,
        'doc_fixed' => 3000000,
        'ioc' => 2000000,
        'toc' => 10000000,
        'ebitda' => 5000000,
        'ebitda_margin' => 33.3333,
        'man_cost' => 1000000,
        'method_cost' => 2000000,
        'material_cost' => 3000000,
        'machine_cost' => 4000000,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('ebitda-values.index', [
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
    ]));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('EbitdaValues/Index')
            ->where('values.data.0.organization.code', '1.B.1')
            ->where('values.data.0.revenue', 15000000)
            ->where('values.data.0.toc', 10000000)
            ->where('filters.year', 2026)
        );
});

test('authenticated users can crud ebitda values', function () {
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
        'source_sheet' => 'Manual CRUD',
        'classification' => 'Governance',
        'revenue' => 15000000,
        'doc_variable' => 5000000,
        'doc_fixed' => 3000000,
        'ioc' => 2000000,
        'man_cost' => 1000000,
        'method_cost' => 2000000,
        'material_cost' => 3000000,
        'machine_cost' => 4000000,
    ];

    $this->withSession(['_token' => $csrfToken])
        ->post(route('ebitda-values.store'), [
            ...$payload,
            '_token' => $csrfToken,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $value = EbitdaValue::query()
        ->where('organization_id', $organization->id)
        ->firstOrFail();

    expect((float) $value->toc)->toBe(10000000.0)
        ->and((float) $value->ebitda)->toBe(5000000.0);

    $this->withSession(['_token' => $csrfToken])
        ->put(route('ebitda-values.update', $value), [
            ...$payload,
            '_token' => $csrfToken,
            'revenue' => 20000000,
            'doc_variable' => 6000000,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $value->refresh();

    expect((float) $value->toc)->toBe(11000000.0)
        ->and((float) $value->ebitda)->toBe(9000000.0);

    $this->withSession(['_token' => $csrfToken])
        ->delete(route('ebitda-values.destroy', $value), [
            '_token' => $csrfToken,
        ])
        ->assertRedirect();

    $this->assertDatabaseMissing('ebitda_values', [
        'id' => $value->id,
    ]);
});

test('ebitda values page displays editable source rows and exposes parent rollup value', function () {
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
        'doc_variable' => 5000000,
        'doc_fixed' => 5000000,
        'ioc' => 0,
        'toc' => 10000000,
        'ebitda' => 40000000,
        'ebitda_margin' => 80,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('ebitda-values.index', [
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
    ]));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('values.data.0.organization.code', '1.A')
            ->where('values.data.0.value_source', 'calculated_from_children')
            ->where('values.data.0.revenue', 999000000)
            ->where('values.data.0.toc', 999000000)
            ->where('values.data.0.ebitda', 0)
            ->where('values.data.0.ebitda_margin', null)
            ->where('values.data.0.resolved_value.revenue', 150000000)
            ->where('values.data.0.resolved_value.toc', 30000000)
            ->where('values.data.0.resolved_value.ebitda', 120000000)
            ->where('values.data.0.resolved_value.ebitda_margin', 80)
        );

    $this->withSession(['_token' => $csrfToken])
        ->put(route('ebitda-values.update', $parentValue), [
            '_token' => $csrfToken,
            'organization_id' => $parent->id,
            'year' => 2026,
            'period_date' => null,
            'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
            'source_sheet' => 'Parent exact row',
            'classification' => 'Parent',
            'revenue' => 123000000,
            'doc_variable' => 10000000,
            'doc_fixed' => 5000000,
            'ioc' => 5000000,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $response = $this->get(route('ebitda-values.index', [
        'year' => 2026,
        'scenario' => EbitdaValue::SCENARIO_TARGET_TAHUNAN,
    ]));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('values.data.0.organization.code', '1.A')
            ->where('values.data.0.revenue', 123000000)
            ->where('values.data.0.toc', 20000000)
            ->where('values.data.0.ebitda', 103000000)
            ->where('values.data.0.ebitda_margin', 83.7398)
            ->where('values.data.0.resolved_value.revenue', 150000000)
            ->where('values.data.0.resolved_value.toc', 30000000)
        );
});
