<?php

use App\Enums\RoleLevel;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $role = Role::factory()->create(['level' => RoleLevel::Superadmin]);
    $this->actingAs(User::factory()->create(['role_id' => $role->id]));
});

test('superadmin can visit users', function () {
    $response = $this->get(route('users.index', ['search' => 'budi@example.com']));

    $response->assertOk();
});

test('users page displays the correct component', function () {
    $role = Role::factory()->create([
        'name' => 'Kasir',
        'slug' => 'kasir',
        'level' => RoleLevel::Staff,
    ]);

    User::factory()->create([
        'role_id' => $role->id,
        'name' => 'Budi Kasir',
        'email' => 'budi@example.com',
    ]);

    $response = $this->get(route('users.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Users/Index')
            ->where('users.data.0.name', 'Budi Kasir')
            ->where('users.data.0.username', 'budi-kasir')
            ->where('users.data.0.role.name', 'Kasir')
        );
});

test('store creates a user with role and generated username', function () {
    $role = Role::factory()->create([
        'name' => 'Admin Gudang',
        'slug' => 'admin-gudang',
    ]);

    $this->post(route('users.store'), [
        'role_id' => $role->id,
        'name' => 'Admin Gudang Satu',
        'email' => 'admin.gudang@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $user = User::query()
        ->where('email', 'admin.gudang@example.com')
        ->firstOrFail();

    expect($user->role_id)->toBe($role->id)
        ->and($user->username)->toBe('admin-gudang-satu')
        ->and(Hash::check('password', $user->password))->toBeTrue();
});

test('store accepts eight character alphanumeric password', function () {
    $role = Role::factory()->create();

    $this->post(route('users.store'), [
        'role_id' => $role->id,
        'name' => 'User Password',
        'email' => 'password.user@example.com',
        'password' => 'abc12345',
        'password_confirmation' => 'abc12345',
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect(User::query()->where('email', 'password.user@example.com')->exists())
        ->toBeTrue();
});

test('store rejects password with symbol', function () {
    $role = Role::factory()->create();

    $this->post(route('users.store'), [
        'role_id' => $role->id,
        'name' => 'User Symbol',
        'email' => 'symbol.user@example.com',
        'password' => 'abc123!@',
        'password_confirmation' => 'abc123!@',
    ])->assertSessionHasErrors('password');
});

test('store keeps generated usernames unique', function () {
    $role = Role::factory()->create();

    User::factory()->create([
        'role_id' => $role->id,
        'name' => 'Kasir Cabang',
        'email' => 'kasir.one@example.com',
    ]);

    $this->post(route('users.store'), [
        'role_id' => $role->id,
        'name' => 'Kasir Cabang',
        'email' => 'kasir.two@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect(User::query()->where('email', 'kasir.two@example.com')->value('username'))
        ->toBe('kasir-cabang-2');
});

test('update modifies user and keeps password when omitted', function () {
    $staffRole = Role::factory()->create([
        'level' => RoleLevel::Staff,
    ]);
    $managerRole = Role::factory()->create([
        'level' => RoleLevel::Manager,
    ]);

    $user = User::factory()->create([
        'role_id' => $staffRole->id,
        'name' => 'Pramuniaga Lama',
        'email' => 'pramuniaga@example.com',
        'password' => 'password',
    ]);

    $passwordHash = $user->password;

    $this->put(route('users.update', $user), [
        'role_id' => $managerRole->id,
        'name' => 'Supervisor Baru',
        'email' => 'supervisor@example.com',
        'password' => null,
        'password_confirmation' => null,
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $user->refresh();

    expect($user->role_id)->toBe($managerRole->id)
        ->and($user->name)->toBe('Supervisor Baru')
        ->and($user->username)->toBe('supervisor-baru')
        ->and($user->email)->toBe('supervisor@example.com')
        ->and($user->password)->toBe($passwordHash);
});

test('destroy deletes a user', function () {
    $user = User::factory()->create();

    $this->delete(route('users.destroy', $user))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect(User::query()->whereKey($user->id)->exists())->toBeFalse();
});

test('search filters users by email', function () {
    User::factory()->create([
        'name' => 'Budi',
        'email' => 'budi@example.com',
    ]);

    User::factory()->create([
        'name' => 'Ani',
        'email' => 'ani@example.com',
    ]);

    $response = $this->get(route('users.index', ['search' => 'budi@example.com']));
    $page = $response->inertiaProps();

    expect($page['users']['data'])->toHaveCount(1)
        ->and($page['users']['data'][0]['email'])->toBe('budi@example.com');
});

test('role filter only shows users from selected role', function () {
    $staffRole = Role::factory()->create([
        'name' => 'Staff',
        'slug' => 'staff',
    ]);
    $managerRole = Role::factory()->create([
        'name' => 'Manager',
        'slug' => 'manager',
    ]);

    User::factory()->create([
        'role_id' => $staffRole->id,
        'name' => 'Staff User',
    ]);
    User::factory()->create([
        'role_id' => $managerRole->id,
        'name' => 'Manager User',
    ]);

    $response = $this->get(route('users.index', ['role_id' => $managerRole->id]));
    $page = $response->inertiaProps();

    expect($page['users']['data'])->toHaveCount(1)
        ->and($page['users']['data'][0]['name'])->toBe('Manager User');
});
