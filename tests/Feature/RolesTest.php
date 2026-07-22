<?php

use App\Enums\RoleLevel;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $role = Role::factory()->create(['level' => RoleLevel::Superadmin]);
    $this->actingAs(User::factory()->create(['role_id' => $role->id]));
});

test('superadmin can visit roles', function () {
    $response = $this->get(route('roles.index', ['search' => 'Kasir']));

    $response->assertOk();
});

test('roles page displays the correct component', function () {
    Role::factory()->create([
        'name' => 'Kasir',
        'slug' => 'kasir',
        'level' => RoleLevel::Staff,
    ]);

    $response = $this->get(route('roles.index', ['search' => 'Kasir']));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Roles/Index')
            ->where('roles.data.0.name', 'Kasir')
            ->where('roles.data.0.level', 'staff')
            ->where('levelOptions.0.value', 'staff')
        );
});

test('store creates a role', function () {
    $this->post(route('roles.store'), [
        'name' => 'Supervisor Gudang',
        'level' => RoleLevel::Manager->value,
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $role = Role::query()
        ->where('name', 'Supervisor Gudang')
        ->firstOrFail();

    expect($role->uuid)->not->toBeEmpty()
        ->and(Str::isUuid($role->uuid))->toBeTrue()
        ->and($role->slug)->toBe('supervisor-gudang')
        ->and($role->level)->toBe(RoleLevel::Manager);
});

test('update modifies a role', function () {
    $role = Role::factory()->create([
        'name' => 'Admin Gudang',
        'slug' => 'admin-gudang',
        'level' => RoleLevel::Staff,
    ]);

    $this->put(route('roles.update', $role), [
        'name' => 'Kepala Cabang',
        'level' => RoleLevel::Manager->value,
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $role->refresh();

    expect($role->name)->toBe('Kepala Cabang')
        ->and($role->slug)->toBe('kepala-cabang')
        ->and($role->level)->toBe(RoleLevel::Manager);
});

test('destroy deletes an unused role', function () {
    $role = Role::factory()->create();

    $this->delete(route('roles.destroy', $role))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect(Role::query()->whereKey($role->id)->exists())->toBeFalse();
});

test('search filters roles by name', function () {
    Role::factory()->create([
        'name' => 'Kasir',
        'slug' => 'kasir',
    ]);

    Role::factory()->create([
        'name' => 'Admin Gudang',
        'slug' => 'admin-gudang',
    ]);

    $response = $this->get(route('roles.index', ['search' => 'Kasir']));

    $page = $response->inertiaProps();

    expect($page['roles']['data'])->toHaveCount(1)
        ->and($page['roles']['data'][0]['name'])->toBe('Kasir');
});

test('roles can be sorted by level descending', function () {
    Role::factory()->create([
        'name' => 'Pramuniaga',
        'slug' => 'pramuniaga',
        'level' => RoleLevel::Staff,
    ]);

    Role::factory()->create([
        'name' => 'Super Admin',
        'slug' => 'super-admin',
        'level' => RoleLevel::Superadmin,
    ]);

    $response = $this->get(route('roles.index', [
        'sort' => 'level',
        'direction' => 'desc',
    ]));

    $page = $response->inertiaProps();

    expect($page['roles']['data'][0]['level'])->toBe('superadmin');
});
