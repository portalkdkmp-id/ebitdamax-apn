<?php

use App\Actions\Fortify\CreateNewUser;
use App\Enums\RoleLevel;
use App\Enums\TaskReportStatus;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskAdditionalField;
use App\Models\TaskCategory;
use App\Models\TaskReport;
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

test('completed task page only shows completed reports for current user', function () {
    $category = TaskCategory::factory()->create(['name' => 'Operasional']);
    $role = Role::factory()->create(['name' => 'Kasir', 'level' => RoleLevel::Staff]);
    $user = User::factory()->create(['role_id' => $role->id]);
    $otherUser = User::factory()->create(['role_id' => $role->id]);
    $task = Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Input Uang Masuk',
    ]);
    $pendingTask = Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Belum Selesai',
    ]);

    TaskReport::query()->create([
        'task_id' => $task->id,
        'user_id' => $user->id,
        'started_at' => now()->subMinutes(20),
        'finished_at' => now(),
        'duration_minutes' => 20,
        'status' => TaskReportStatus::Completed,
    ]);
    TaskReport::query()->create([
        'task_id' => $pendingTask->id,
        'user_id' => $user->id,
        'started_at' => now()->subMinutes(5),
        'status' => TaskReportStatus::InProgress,
    ]);
    TaskReport::query()->create([
        'task_id' => $task->id,
        'user_id' => $otherUser->id,
        'started_at' => now()->subMinutes(10),
        'finished_at' => now(),
        'duration_minutes' => 10,
        'status' => TaskReportStatus::Completed,
    ]);

    $this->actingAs($user)
        ->get(route('task-dashboard.completed'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('TaskDashboard/Completed')
            ->where('reports.data.0.task.name', 'Input Uang Masuk')
            ->where('reports.total', 1)
        );
});

test('superadmin completed task page shows completed reports from all roles', function () {
    $category = TaskCategory::factory()->create(['name' => 'Operasional']);
    $superadminRole = Role::factory()->create(['level' => RoleLevel::Superadmin]);
    $staffRole = Role::factory()->create(['name' => 'Kasir', 'level' => RoleLevel::Staff]);
    $managerRole = Role::factory()->create(['name' => 'Manager', 'level' => RoleLevel::Manager]);
    $superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
    $staff = User::factory()->create(['role_id' => $staffRole->id]);
    $manager = User::factory()->create(['role_id' => $managerRole->id]);
    $staffTask = Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $staffRole->id,
        'name' => 'Tutup Kasir',
    ]);
    $managerTask = Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $managerRole->id,
        'name' => 'Review Shift',
    ]);

    TaskReport::query()->create([
        'task_id' => $staffTask->id,
        'user_id' => $staff->id,
        'started_at' => now()->subMinutes(20),
        'finished_at' => now()->subMinutes(10),
        'duration_minutes' => 10,
        'status' => TaskReportStatus::Completed,
    ]);
    TaskReport::query()->create([
        'task_id' => $managerTask->id,
        'user_id' => $manager->id,
        'started_at' => now()->subMinutes(15),
        'finished_at' => now(),
        'duration_minutes' => 15,
        'status' => TaskReportStatus::Completed,
    ]);

    $this->actingAs($superadmin)
        ->get(route('task-dashboard.completed'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('TaskDashboard/Completed')
            ->where('reports.total', 2)
            ->where('reports.data.0.task.role.name', 'Manager')
            ->where('reports.data.1.task.role.name', 'Kasir')
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
