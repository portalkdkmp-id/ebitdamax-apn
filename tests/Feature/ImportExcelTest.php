<?php

use App\Models\ExcelImport;
use App\Models\ImportErrorLog;
use App\Models\User;
use App\Services\EbitdaExcelParser;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('import-excel.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the import excel page', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('import-excel.index'));

    $response->assertOk();
});

test('authenticated users can see import error logs on the import excel page', function () {
    $user = User::factory()->create();

    $excelImport = ExcelImport::query()->create([
        'filename' => 'imports/ebitdamax/template.xlsx',
        'original_filename' => 'template.xlsx',
        'status' => 'completed_with_errors',
        'total_rows' => 1,
        'success_rows' => 0,
        'failed_rows' => 1,
        'created_by' => $user->id,
    ]);

    ImportErrorLog::query()->create([
        'excel_import_id' => $excelImport->id,
        'sheet_name' => 'Dashboard',
        'row_number' => 12,
        'message' => 'Kode organisasi 9.X tidak ditemukan di database.',
        'payload' => [
            'code' => '9.X',
        ],
    ]);

    $this->actingAs($user);

    $response = $this->get(route('import-excel.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Import/Index')
            ->where('imports.0.status', 'completed_with_errors')
            ->where('imports.0.errors.0.message', 'Kode organisasi 9.X tidak ditemukan di database.')
            ->where('imports.0.errors.0.payload.code', '9.X')
        );
});

test('uploaded excel file is parsed from the configured local storage path', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $csrfToken = 'test-token';

    $this->actingAs($user);

    $this->mock(EbitdaExcelParser::class, function ($mock) {
        $mock->shouldReceive('parse')
            ->once()
            ->withArgs(function (string $filePath, int $year): bool {
                return $year === 2026
                    && str_contains($filePath, 'imports/ebitdamax')
                    && is_file($filePath);
            })
            ->andReturn([
                'records' => [],
                'errors' => [],
            ]);
    });

    $response = $this->withSession(['_token' => $csrfToken])
        ->post(route('import-excel.store'), [
            '_token' => $csrfToken,
            'year' => 2026,
            'file' => UploadedFile::fake()->create('ebitdamax.xlsx', 12),
        ]);

    $response
        ->assertRedirect()
        ->assertSessionHas('success');

    $excelImport = ExcelImport::query()->firstOrFail();

    expect(Storage::disk('local')->exists($excelImport->filename))->toBeTrue()
        ->and($excelImport->status)->toBe('completed');
});
