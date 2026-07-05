<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EbitdaTreeController;
use App\Http\Controllers\EbitdaValueController;
use App\Http\Controllers\ExcelImportController;
use App\Http\Controllers\OrganizationCalculationController;
use App\Http\Controllers\OrganizationController;
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
Route::get('/value-chain-jobdesk', [ValueChainJobdeskController::class, 'index'])
    ->name('value-chain-jobdesk.index');
Route::get('/kalkulasi', [OrganizationCalculationController::class, 'index'])
    ->name('calculations.index');
Route::resource('ebitda-values', EbitdaValueController::class)
    ->except(['create', 'edit', 'show']);
// });

require __DIR__.'/settings.php';
