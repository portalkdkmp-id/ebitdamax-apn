<?php

use App\Enums\RoleLevel;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskAdditionalField;
use App\Models\TaskCategory;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $role = Role::factory()->create(['level' => RoleLevel::Superadmin]);
    $this->actingAs(User::factory()->create(['role_id' => $role->id]));
});

test('superadmin can visit tasks', function () {
    $response = $this->get(route('tasks.index'));

    $response->assertOk();
});

test('tasks page displays the correct component', function () {
    $category = TaskCategory::factory()->create(['name' => 'Operasional']);
    $role = Role::factory()->create(['name' => 'Kasir', 'level' => RoleLevel::Staff]);

    Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Input Uang Masuk',
    ]);

    $response = $this->get(route('tasks.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tasks/Index')
            ->where('tasks.data.0.name', 'Input Uang Masuk')
            ->where('tasks.data.0.task_category.name', 'Operasional')
            ->where('tasks.data.0.role.name', 'Kasir')
        );
});

test('store creates task with additional fields', function () {
    $category = TaskCategory::factory()->create();
    $role = Role::factory()->create();

    $this->post(route('tasks.store'), [
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Input Uang Masuk',
        'description' => 'Catat uang masuk harian.',
        'time_require' => 30,
        'is_active' => true,
        'additional_fields' => [
            [
                'label' => 'Uang Masuk',
                'input_type' => 'integer',
                'show_when' => 'finish',
                'is_required' => true,
                'options' => [],
            ],
            [
                'label' => 'Nama Pelanggan',
                'input_type' => 'text',
                'show_when' => 'start',
                'is_required' => false,
                'options' => [],
            ],
        ],
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $task = Task::query()->where('name', 'Input Uang Masuk')->firstOrFail();

    expect($task->uuid)->not->toBeEmpty()
        ->and(Str::isUuid($task->uuid))->toBeTrue()
        ->and($task->additionalFields()->count())->toBe(2);

    $field = $task->additionalFields()->where('label', 'Uang Masuk')->firstOrFail();

    expect($field->field_name)->toBe('uang_masuk')
        ->and($field->input_type->value)->toBe('integer')
        ->and($field->show_when->value)->toBe('finish')
        ->and($field->is_required)->toBeTrue();
});

test('store saves options for select fields', function () {
    $category = TaskCategory::factory()->create();
    $role = Role::factory()->create();

    $this->post(route('tasks.store'), [
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Cek Kondisi Gudang',
        'description' => null,
        'time_require' => 45,
        'is_active' => true,
        'additional_fields' => [
            [
                'label' => 'Kondisi',
                'input_type' => 'select',
                'show_when' => 'finish',
                'is_required' => true,
                'options' => ['Baik', 'Rusak', 'Perlu Follow Up'],
            ],
        ],
    ])->assertSessionHasNoErrors();

    $field = TaskAdditionalField::query()->firstOrFail();

    expect($field->options)->toBe(['Baik', 'Rusak', 'Perlu Follow Up']);
});

test('update modifies task and syncs additional fields', function () {
    $category = TaskCategory::factory()->create();
    $role = Role::factory()->create();
    $task = Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Task Lama',
    ]);
    $field = TaskAdditionalField::factory()->create([
        'task_id' => $task->id,
        'label' => 'Field Lama',
        'field_name' => 'field_lama',
    ]);
    TaskAdditionalField::factory()->create([
        'task_id' => $task->id,
        'label' => 'Field Dihapus',
        'field_name' => 'field_dihapus',
    ]);

    $this->put(route('tasks.update', $task), [
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Task Baru',
        'description' => 'Deskripsi baru.',
        'time_require' => 90,
        'is_active' => false,
        'additional_fields' => [
            [
                'id' => $field->id,
                'label' => 'Field Update',
                'input_type' => 'textarea',
                'show_when' => 'start',
                'is_required' => true,
                'options' => [],
            ],
            [
                'label' => 'Field Baru',
                'input_type' => 'date',
                'show_when' => 'finish',
                'is_required' => false,
                'options' => [],
            ],
        ],
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $task->refresh();

    expect($task->name)->toBe('Task Baru')
        ->and($task->time_require)->toBe(90)
        ->and($task->is_active)->toBeFalse()
        ->and($task->additionalFields()->count())->toBe(2);

    $field->refresh();

    expect($field->label)->toBe('Field Update')
        ->and($field->field_name)->toBe('field_update');
});

test('destroy deletes task and additional fields', function () {
    $task = Task::factory()->create();
    TaskAdditionalField::factory()->create(['task_id' => $task->id]);

    $this->delete(route('tasks.destroy', $task))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect(Task::query()->count())->toBe(0)
        ->and(TaskAdditionalField::query()->count())->toBe(0);
});

test('filters tasks by category role and active status', function () {
    $category = TaskCategory::factory()->create(['name' => 'Gudang']);
    $otherCategory = TaskCategory::factory()->create(['name' => 'Kasir']);
    $role = Role::factory()->create(['name' => 'Admin Gudang']);
    $otherRole = Role::factory()->create(['name' => 'Kasir']);

    Task::factory()->create([
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'name' => 'Stock Opname',
        'is_active' => true,
    ]);
    Task::factory()->create([
        'task_category_id' => $otherCategory->id,
        'role_id' => $otherRole->id,
        'name' => 'Tutup Kasir',
        'is_active' => false,
    ]);

    $response = $this->get(route('tasks.index', [
        'task_category_id' => $category->id,
        'role_id' => $role->id,
        'status' => 'active',
    ]));
    $page = $response->inertiaProps();

    expect($page['tasks']['data'])->toHaveCount(1)
        ->and($page['tasks']['data'][0]['name'])->toBe('Stock Opname');
});
