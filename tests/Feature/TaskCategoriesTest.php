<?php

use App\Enums\RoleLevel;
use App\Models\Role;
use App\Models\TaskCategory;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $role = Role::factory()->create(['level' => RoleLevel::Superadmin]);
    $this->actingAs(User::factory()->create(['role_id' => $role->id]));
});

test('superadmin can visit task categories', function () {
    $response = $this->get(route('task-categories.index'));

    $response->assertOk();
});

test('task categories page displays the correct component', function () {
    TaskCategory::factory()->create([
        'name' => 'Operasional Harian',
        'slug' => 'operasional-harian',
        'description' => 'Kategori task operasional harian.',
    ]);

    $response = $this->get(route('task-categories.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('TaskCategories/Index')
            ->where('taskCategories.data.0.name', 'Operasional Harian')
            ->where('taskCategories.data.0.slug', 'operasional-harian')
        );
});

test('store creates a task category', function () {
    $this->post(route('task-categories.store'), [
        'name' => 'Laporan Penjualan',
        'description' => 'Task laporan penjualan harian.',
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $taskCategory = TaskCategory::query()
        ->where('name', 'Laporan Penjualan')
        ->firstOrFail();

    expect($taskCategory->uuid)->not->toBeEmpty()
        ->and(Str::isUuid($taskCategory->uuid))->toBeTrue()
        ->and($taskCategory->slug)->toBe('laporan-penjualan')
        ->and($taskCategory->description)->toBe('Task laporan penjualan harian.');
});

test('update modifies a task category', function () {
    $taskCategory = TaskCategory::factory()->create([
        'name' => 'Kategori Lama',
        'slug' => 'kategori-lama',
        'description' => 'Deskripsi lama.',
    ]);

    $this->put(route('task-categories.update', $taskCategory), [
        'name' => 'Kategori Baru',
        'description' => 'Deskripsi baru.',
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $taskCategory->refresh();

    expect($taskCategory->name)->toBe('Kategori Baru')
        ->and($taskCategory->slug)->toBe('kategori-baru')
        ->and($taskCategory->description)->toBe('Deskripsi baru.');
});

test('destroy deletes a task category', function () {
    $taskCategory = TaskCategory::factory()->create();

    $this->delete(route('task-categories.destroy', $taskCategory))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect(TaskCategory::query()->count())->toBe(0);
});

test('search filters task categories by name', function () {
    TaskCategory::factory()->create([
        'name' => 'Operasional Harian',
        'slug' => 'operasional-harian',
    ]);

    TaskCategory::factory()->create([
        'name' => 'Audit Gudang',
        'slug' => 'audit-gudang',
    ]);

    $response = $this->get(route('task-categories.index', ['search' => 'Audit']));
    $page = $response->inertiaProps();

    expect($page['taskCategories']['data'])->toHaveCount(1)
        ->and($page['taskCategories']['data'][0]['name'])->toBe('Audit Gudang');
});

test('task categories can be sorted by name descending', function () {
    TaskCategory::factory()->create([
        'name' => 'Alpha',
        'slug' => 'alpha',
    ]);

    TaskCategory::factory()->create([
        'name' => 'Zulu',
        'slug' => 'zulu',
    ]);

    $response = $this->get(route('task-categories.index', [
        'sort' => 'name',
        'direction' => 'desc',
    ]));
    $page = $response->inertiaProps();

    expect($page['taskCategories']['data'][0]['name'])->toBe('Zulu');
});
