<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\BusinessProcessController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DashboardRedirectController;
use App\Http\Controllers\EbitdaTreeController;
use App\Http\Controllers\EbitdaValueController;
use App\Http\Controllers\ExcelImportController;
use App\Http\Controllers\KdkmpDashboardController;
use App\Http\Controllers\KdkmpDashboardMonitoringController;
use App\Http\Controllers\KdkmpDashboardTaskController;
use App\Http\Controllers\LmsKdkmpController;
use App\Http\Controllers\LumbungChatController;
use App\Http\Controllers\MeetingActionItemController;
use App\Http\Controllers\MeetingMinuteController;
use App\Http\Controllers\MonitoringDashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OrganizationCalculationController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PlanEbitdaMatrixController;
use App\Http\Controllers\RevenuePlanController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SdmKdkmpEntryController;
use App\Http\Controllers\TaskCategoryController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskDashboardController;
use App\Http\Controllers\TaskReportController;
use App\Http\Controllers\TaskReportDocumentController;
use App\Http\Controllers\UnitCostAssumptionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ValueChainJobdeskController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardRedirectController::class)->name('dashboard');

    Route::get('/lumbung-kms/chat', LumbungChatController::class)
        ->name('lumbung-kms.chat');

    Route::get('/lms-kdkmp', LmsKdkmpController::class)
        ->name('lms-kdkmp.index');

    Route::get('/dashboard/kdkmp', [KdkmpDashboardController::class, 'index'])
        ->name('kdkmp-dashboard.index');

    Route::get('/dashboard/kdkmp/input', [KdkmpDashboardController::class, 'input'])
        ->name('kdkmp-dashboard.input');

    Route::put('/dashboard/kdkmp/today', [KdkmpDashboardController::class, 'upsert'])
        ->name('kdkmp-dashboard.upsert');

    Route::put(
        '/dashboard/kdkmp/today/operational-attendance',
        [KdkmpDashboardController::class, 'saveOperationalAttendance']
    )->name('kdkmp-dashboard.operational-attendance.save');

    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
        ->name('notifications.read');

    Route::post('/users/complete-onboarding', [OnboardingController::class, 'complete'])
        ->name('users.complete-onboarding');

    Route::get('/admin/kdkmp-dashboard', KdkmpDashboardMonitoringController::class)
        ->name('admin.kdkmp-dashboard.index');

    Route::get('/admin/kdkmp-dashboard/{kdkmpEntry}/tasks/{date}', [KdkmpDashboardTaskController::class, 'index'])
        ->name('admin.kdkmp-dashboard.tasks');

    Route::middleware('ebitdamax.domain:apn')->group(function () {
        Route::get('/admin-dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');

        Route::get('/ebitda-tree', [EbitdaTreeController::class, 'index'])->name('ebitda-tree.index');

        Route::get('/dashboard/directorates/{organization}', [DashboardController::class, 'showDirectorate'])
            ->name('dashboard.directorates.show');
    });

    Route::get('/dashboard/tasks', [TaskDashboardController::class, 'index'])
        ->middleware('role.level:staff,manager,superadmin')
        ->name('task-dashboard.index');

    Route::get('/dashboard/tasks/completed', [TaskDashboardController::class, 'completed'])
        ->middleware('role.level:staff,manager,superadmin')
        ->name('task-dashboard.completed');

    Route::post('/tasks/{task}/start', [TaskReportController::class, 'start'])
        ->middleware('role.level:staff,manager,superadmin')
        ->name('tasks.start');

    Route::post('/tasks/{task}/finish', [TaskReportController::class, 'finish'])
        ->middleware('role.level:staff,manager,superadmin')
        ->name('tasks.finish');

    Route::get(
        '/task-reports/{taskReport}/documents/{phase}/{documentIndex}/preview',
        [TaskReportDocumentController::class, 'preview']
    )
        ->whereIn('phase', ['start', 'finish'])
        ->whereNumber('documentIndex')
        ->name('task-reports.documents.preview');

    Route::get(
        '/task-reports/{taskReport}/documents/{phase}/{documentIndex}/download',
        [TaskReportDocumentController::class, 'download']
    )
        ->whereIn('phase', ['start', 'finish'])
        ->whereNumber('documentIndex')
        ->name('task-reports.documents.download');

    Route::get(
        '/task-reports/{taskReport}/photos/{phase}/preview',
        [TaskReportDocumentController::class, 'previewPhoto']
    )
        ->whereIn('phase', ['start', 'finish'])
        ->name('task-reports.photos.preview');

    Route::get(
        '/task-reports/{taskReport}/photos/{phase}/download',
        [TaskReportDocumentController::class, 'downloadPhoto']
    )
        ->whereIn('phase', ['start', 'finish'])
        ->name('task-reports.photos.download');

    Route::get(
        '/task-reports/{taskReport}/additional-fields/{taskReportValue}/preview',
        [TaskReportDocumentController::class, 'previewAdditionalField']
    )->name('task-reports.additional-fields.preview');

    Route::get(
        '/task-reports/{taskReport}/additional-fields/{taskReportValue}/download',
        [TaskReportDocumentController::class, 'downloadAdditionalField']
    )->name('task-reports.additional-fields.download');

    Route::resource('meeting-minutes', MeetingMinuteController::class)
        ->except(['create', 'edit', 'show']);

    Route::get('/business-processes/kdkmp-gerai', [BusinessProcessController::class, 'kdkmpGerai'])
        ->name('business-processes.kdkmp-gerai.index');
    Route::post('/business-processes/kdkmp-gerai', [BusinessProcessController::class, 'store'])
        ->name('business-processes.kdkmp-gerai.store');
    Route::put('/business-processes/kdkmp-gerai/{businessProcess}', [BusinessProcessController::class, 'update'])
        ->name('business-processes.kdkmp-gerai.update');

    Route::get('/unit-cost-assumptions/kdkmp-gerai', [UnitCostAssumptionController::class, 'kdkmpGerai'])
        ->name('unit-cost-assumptions.kdkmp-gerai.index');
    Route::post('/unit-cost-assumptions/kdkmp-gerai', [UnitCostAssumptionController::class, 'store'])
        ->name('unit-cost-assumptions.kdkmp-gerai.store');
    Route::put('/unit-cost-assumptions/kdkmp-gerai/{unitCostAssumption}', [UnitCostAssumptionController::class, 'update'])
        ->name('unit-cost-assumptions.kdkmp-gerai.update');

    Route::get('/revenue-plans/kdkmp-gerai', [RevenuePlanController::class, 'kdkmpGerai'])
        ->name('revenue-plans.kdkmp-gerai.index');
    Route::post('/revenue-plans/kdkmp-gerai', [RevenuePlanController::class, 'store'])
        ->name('revenue-plans.kdkmp-gerai.store');
    Route::put('/revenue-plans/kdkmp-gerai/{revenuePlan}', [RevenuePlanController::class, 'update'])
        ->name('revenue-plans.kdkmp-gerai.update');

    Route::get('/plan-ebitda-matrices/kdkmp-gerai', [PlanEbitdaMatrixController::class, 'kdkmpGerai'])
        ->name('plan-ebitda-matrices.kdkmp-gerai.index');
    Route::post('/plan-ebitda-matrices/kdkmp-gerai', [PlanEbitdaMatrixController::class, 'store'])
        ->name('plan-ebitda-matrices.kdkmp-gerai.store');
    Route::put('/plan-ebitda-matrices/kdkmp-gerai/{planEbitdaMatrix}', [PlanEbitdaMatrixController::class, 'update'])
        ->name('plan-ebitda-matrices.kdkmp-gerai.update');

    Route::get(
        '/meeting-minutes/{meetingMinute}/attachments/{attachment}/preview',
        [MeetingMinuteController::class, 'previewAttachment']
    )->name('meeting-minutes.attachments.preview');

    Route::get(
        '/meeting-minutes/{meetingMinute}/attachments/{attachment}/download',
        [MeetingMinuteController::class, 'downloadAttachment']
    )->name('meeting-minutes.attachments.download');

    Route::middleware('role.level:manager,superadmin')->group(function () {
        Route::get('/meeting-minutes/action-items', [MeetingActionItemController::class, 'index'])
            ->name('meeting-minutes.action-items.index');

        Route::patch('/meeting-minutes/action-items/{meetingMinuteItem}', [MeetingActionItemController::class, 'update'])
            ->name('meeting-minutes.action-items.update');
    });

    Route::middleware('role.level:superadmin')->group(function () {
        Route::get('/announcements', [AnnouncementController::class, 'index'])
            ->name('announcements.index');
        Route::post('/announcements', [AnnouncementController::class, 'store'])
            ->name('announcements.store');

        Route::resource('organizations', OrganizationController::class)
            ->except(['create', 'edit', 'show']);

        Route::resource('roles', RoleController::class)
            ->except(['create', 'edit', 'show']);

        Route::resource('users', UserController::class)
            ->except(['create', 'edit', 'show']);

        Route::resource('task-categories', TaskCategoryController::class)
            ->except(['create', 'edit', 'show']);

        Route::resource('tasks', TaskController::class)
            ->except(['create', 'edit', 'show']);

        Route::get('/import-excel', [ExcelImportController::class, 'index'])
            ->name('import-excel.index');

        Route::post('/import-excel', [ExcelImportController::class, 'store'])
            ->name('import-excel.store');

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

    });
});

require __DIR__.'/settings.php';
