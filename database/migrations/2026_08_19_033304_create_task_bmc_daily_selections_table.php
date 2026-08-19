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
        Schema::create('task_bmc_daily_selections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bmc_point_id')->constrained('bmc_points')->restrictOnDelete();
            $table->date('selection_date');
            $table->timestamps();

            $table->unique(['user_id', 'selection_date']);
            $table->index(['selection_date', 'bmc_point_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_bmc_daily_selections');
    }
};
