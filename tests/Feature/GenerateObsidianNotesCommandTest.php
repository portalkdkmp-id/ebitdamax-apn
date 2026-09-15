<?php

use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->files = new Filesystem;
    $this->vault = sys_get_temp_dir().'/ebitdamax-notes-'.Str::uuid();
    $this->files->ensureDirectoryExists($this->vault);
});

afterEach(function () {
    $this->files->deleteDirectory($this->vault);
});

test('generates obsidian notes from models, controllers, routes, and features', function () {
    $this->artisan('notes:generate', ['--path' => $this->vault, '--folder' => 'Catatan'])
        ->assertSuccessful();

    $index = $this->vault.'/Catatan/Indeks.md';

    expect($this->files->exists($index))->toBeTrue()
        ->and($this->files->get($index))->toContain('[[Task]]')
        ->and($this->files->get($index))->toContain('[[TaskController]]');

    $taskModel = $this->vault.'/Catatan/Models/Task.md';

    expect($this->files->exists($taskModel))->toBeTrue();

    $taskContents = $this->files->get($taskModel);

    expect($taskContents)
        ->toContain('table: tasks')
        ->toContain('[[TaskCategory]]')
        ->toContain('[[TaskController]]')
        ->toContain('`forKdkmpExecution`');

    $taskController = $this->vault.'/Catatan/Controllers/TaskController.md';

    expect($this->files->exists($taskController))->toBeTrue();

    $controllerContents = $this->files->get($taskController);

    expect($controllerContents)
        ->toContain('`tasks.index`')
        ->toContain('`role.level:superadmin`')
        ->toContain('[[Task]]')
        ->toContain('resources/js/pages/Tasks/Index');

    expect($this->files->exists($this->vault.'/Catatan/Fitur'))->toBeTrue()
        ->and($this->files->allFiles($this->vault.'/Catatan/Fitur'))->not->toBeEmpty();
});

test('skips base controller and abstract classes', function () {
    $this->artisan('notes:generate', ['--path' => $this->vault, '--folder' => 'Catatan', '--only' => 'controllers'])
        ->assertSuccessful();

    expect($this->files->exists($this->vault.'/Catatan/Controllers/Controller.md'))->toBeFalse();
});

test('only generates requested sections', function () {
    $this->artisan('notes:generate', ['--path' => $this->vault, '--folder' => 'Catatan', '--only' => 'models'])
        ->assertSuccessful();

    expect($this->files->exists($this->vault.'/Catatan/Models/Task.md'))->toBeTrue()
        ->and($this->files->exists($this->vault.'/Catatan/Indeks.md'))->toBeFalse()
        ->and($this->files->isDirectory($this->vault.'/Catatan/Controllers'))->toBeFalse()
        ->and($this->files->isDirectory($this->vault.'/Catatan/Fitur'))->toBeFalse();
});

test('prunes stale generated notes', function () {
    $stale = $this->vault.'/Catatan/Models/StaleModel.md';
    $this->files->ensureDirectoryExists(dirname($stale));
    $this->files->put($stale, 'stale');

    $this->artisan('notes:generate', ['--path' => $this->vault, '--folder' => 'Catatan', '--prune' => true])
        ->assertSuccessful();

    expect($this->files->exists($stale))->toBeFalse()
        ->and($this->files->exists($this->vault.'/Catatan/Models/Task.md'))->toBeTrue();
});

test('rejects unknown sections', function () {
    $this->artisan('notes:generate', ['--path' => $this->vault, '--only' => 'unknown'])
        ->assertFailed();
});
