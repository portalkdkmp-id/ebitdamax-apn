<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EbitdaTreeController;
use App\Http\Controllers\EbitdaValueController;
use App\Http\Controllers\ExcelImportController;
use App\Http\Controllers\MonitoringDashboardController;
use App\Http\Controllers\OrganizationCalculationController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\SdmKdkmpEntryController;
use App\Http\Controllers\ValueChainJobdeskController;
use Illuminate\Support\Facades\Route;

// Route::inertia('/', 'welcome')->name('home');

// Route::middleware(['auth', 'verified'])->group(function () {
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

Route::resource('organizations', OrganizationController::class)
    ->except(['create', 'edit', 'show']);

Route::get('/ebitda-tree', [EbitdaTreeController::class, 'index'])->name('ebitda-tree.index');

Route::get('/import-excel', [ExcelImportController::class, 'index'])
    ->name('import-excel.index');

Route::post('/import-excel', [ExcelImportController::class, 'store'])
    ->name('import-excel.store');

Route::get('/dashboard/directorates/{organization}', [DashboardController::class, 'showDirectorate'])
    ->name('dashboard.directorates.show');

Route::resource('ebitda-values', EbitdaValueController::class)
    ->except(['create', 'edit', 'show']);

Route::get('/kalkulasi', [OrganizationCalculationController::class, 'index'])
    ->name('calculations.index');

Route::post('/kalkulasi', [OrganizationCalculationController::class, 'store'])
    ->name('calculations.store');

Route::put('/kalkulasi/{calculation}', [OrganizationCalculationController::class, 'update'])
    ->name('calculations.update');

Route::delete('/kalkulasi/{calculation}', [OrganizationCalculationController::class, 'destroy'])
    ->name('calculations.destroy');

Route::get('/value-chain-jobdesk', [ValueChainJobdeskController::class, 'index'])
    ->name('value-chain-jobdesk.index');

Route::post('/value-chain-jobdesk', [ValueChainJobdeskController::class, 'store'])
    ->name('value-chain-jobdesk.store');

Route::put('/value-chain-jobdesk/{profile}', [ValueChainJobdeskController::class, 'update'])
    ->name('value-chain-jobdesk.update');

Route::delete('/value-chain-jobdesk/{profile}', [ValueChainJobdeskController::class, 'destroy'])
    ->name('value-chain-jobdesk.destroy');

Route::get('/monitoring', [MonitoringDashboardController::class, 'index'])
    ->name('monitoring.index');

Route::get('/monitoring/map-points', [MonitoringDashboardController::class, 'mapPointsMeta'])
    ->name('monitoring.map-points');

Route::get('/monitoring/map-points-binary', [MonitoringDashboardController::class, 'mapPointsBinary'])
    ->name('monitoring.map-points-binary');

Route::resource('sdm-data', SdmKdkmpEntryController::class, ['parameters' => ['sdm-data' => 'sdm_data']])
    ->only(['index', 'update']);
// });

require __DIR__.'/settings.php';
