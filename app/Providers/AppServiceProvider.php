<?php

namespace App\Providers;

use App\Models\EbitdamaxKdkmp;
use App\Models\SdmKdkmpEntry;
use App\Models\Task;
use App\Models\TaskReport;
use App\Models\TaskReportValue;
use App\Models\User;
use App\Models\UserRegionalAssignment;
use App\Observers\InvalidateKdkmpMonitoringCache;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureKdkmpMonitoringCacheInvalidation();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): Password => Password::min(8));
    }

    /**
     * Refreshes cached monitoring data only after its database changes commit.
     */
    private function configureKdkmpMonitoringCacheInvalidation(): void
    {
        foreach ([
            EbitdamaxKdkmp::class,
            SdmKdkmpEntry::class,
            Task::class,
            TaskReport::class,
            TaskReportValue::class,
            User::class,
            UserRegionalAssignment::class,
        ] as $model) {
            $model::observe(InvalidateKdkmpMonitoringCache::class);
        }
    }
}
