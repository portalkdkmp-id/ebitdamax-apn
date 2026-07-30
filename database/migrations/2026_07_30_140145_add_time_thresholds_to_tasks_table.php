<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->unsignedInteger('lower_time_threshold_minutes')
                ->nullable()
                ->after('time_require');
            $table->unsignedInteger('upper_time_threshold_minutes')
                ->nullable()
                ->after('lower_time_threshold_minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'lower_time_threshold_minutes',
                'upper_time_threshold_minutes',
            ]);
        });
    }
};
