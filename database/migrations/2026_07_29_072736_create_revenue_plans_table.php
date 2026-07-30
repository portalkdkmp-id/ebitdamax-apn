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
        Schema::create('revenue_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->date('plan_date');
            $table->decimal('rka_revenue_target', 20, 2)->nullable();
            $table->decimal('planned_production_quantity', 12, 3)->nullable();
            $table->unsignedSmallInteger('days_per_month');
            $table->decimal('daily_rka_revenue_target', 20, 2)->nullable();
            $table->decimal('planned_total_daily_revenue', 20, 2);
            $table->string('source_sheet');
            $table->timestamps();

            $table->index(['user_id', 'plan_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('revenue_plans');
    }
};
