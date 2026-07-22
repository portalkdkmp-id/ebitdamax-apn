<?php

use App\Actions\Fortify\CreateNewUser;
use App\Enums\RoleLevel;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskAdditionalField;
use App\Models\TaskCategory;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to login for dashboard', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('superadmin dashboard redirects to admin dashboard', function () {
    $role = Role::factory()->create(['level' => RoleLevel::Superadmin]);
    $user = User::factory()->create(['role_id' => $role->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('admin.dashboard'));
});

test('staff dashboard redirects to task dashboard', function () {
    $role = Role::factory()->create(['level' => RoleLevel::Staff]);
    $user = User::factory()->create(['role_id' => $role->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('task-dashboard.index'));
});

test('staff cannot access superadmin master routes', function () {
    $role = Role::factory()->create(['level' => RoleLevel::Staff]);
    $user = User::factory()->create(['role_id' => $role->id]);

    $this->actingAs($user)
        ->get(route('roles.index'))
        ->assertForbidden();
});

test('task dashboard only shows active tasks for user role', function () {
    $category = TaskCategory::factory()->create(['name' => 'Operasional']);
    $role = Role::factory()->create(['name' => 'Kasir', 'level' => RoleLevel::Staff]);
    $otherRole = Role::factory()->create(['name' => 'Gudang', 'level' => RoleLevel::Staff]);
    $user = User::factory()->create(['role_id' => $role->id]);

    $task = Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Input Uang Masuk',
        'is_active' => true,
    ]);

    TaskAdditionalField::factory()->create([
        'task_id' => $task->id,
        'label' => 'Nama Pelanggan',
        'field_name' => 'nama_pelanggan',
        'show_when' => 'start',
    ]);

    Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $otherRole->id,
        'name' => 'Stock Opname',
        'is_active' => true,
    ]);

    Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Task Non Active',
        'is_active' => false,
    ]);

    $this->actingAs($user)
        ->get(route('task-dashboard.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('TaskDashboard/Index')
            ->where('tasks.0.name', 'Input Uang Masuk')
            ->where('tasks.0.additional_fields.0.label', 'Nama Pelanggan')
            ->where('summary.total', 1)
        );
});

test('registration creates staff role when missing', function () {
    $user = app(CreateNewUser::class)->create([
        'name' => 'Registered User',
        'email' => 'registered@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    expect($user->role?->level)->toBe(RoleLevel::Staff)
        ->and(Role::query()->where('slug', 'staff')->exists())->toBeTrue();
});
