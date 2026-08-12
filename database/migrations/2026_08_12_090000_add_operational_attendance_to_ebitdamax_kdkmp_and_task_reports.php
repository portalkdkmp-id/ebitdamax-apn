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
        Schema::table('ebitdamax_kdkmp', function (Blueprint $table): void {
            $table->json('operational_attendance')->nullable();
            $table->timestamp('operational_attendance_saved_at')->nullable();
        });

        Schema::table('task_reports', function (Blueprint $table): void {
            $table->json('member_allocations')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_reports', function (Blueprint $table): void {
            $table->dropColumn('member_allocations');
        });

        Schema::table('ebitdamax_kdkmp', function (Blueprint $table): void {
            $table->dropColumn([
                'operational_attendance',
                'operational_attendance_saved_at',
            ]);
        });
    }
};
