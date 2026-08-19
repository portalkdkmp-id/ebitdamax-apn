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
            $table->string('task_type')->default('regular');
            $table->foreignId('bmc_point_id')
                ->nullable()
                ->constrained('bmc_points')
                ->restrictOnDelete();

            $table->index(['task_type', 'bmc_point_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['task_type', 'bmc_point_id']);
            $table->dropConstrainedForeignId('bmc_point_id');
            $table->dropColumn('task_type');
        });
    }
};
