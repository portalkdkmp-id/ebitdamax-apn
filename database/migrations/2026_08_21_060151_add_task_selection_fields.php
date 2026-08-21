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
            $table->boolean('is_mandatory')
                ->default(false)
                ->after('is_active');
        });

        Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->json('selected_task_ids')
                ->nullable()
                ->after('operational_attendance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->dropColumn('selected_task_ids');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('is_mandatory');
        });
    }
};
