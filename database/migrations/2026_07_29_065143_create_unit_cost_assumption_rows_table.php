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
        Schema::create('unit_cost_assumption_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_cost_assumption_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order');
            $table->unsignedTinyInteger('source_page');
            $table->string('row_type');
            $table->string('section_code')->nullable();
            $table->string('category')->nullable();
            $table->string('cost_type')->nullable();
            $table->text('component')->nullable();
            $table->decimal('plan_quantity', 12, 3)->nullable();
            $table->decimal('actual_quantity', 12, 3)->nullable();
            $table->text('description')->nullable();
            $table->text('unit')->nullable();
            $table->decimal('base_price', 20, 2)->nullable();
            $table->decimal('plan_daily_cost', 20, 2)->nullable();
            $table->decimal('plan_hourly_cost', 20, 2)->nullable();
            $table->decimal('actual_daily_cost', 20, 2)->nullable();
            $table->decimal('actual_hourly_cost', 20, 2)->nullable();
            $table->decimal('plan_value', 20, 2)->nullable();
            $table->decimal('actual_value', 20, 2)->nullable();
            $table->timestamps();

            $table->unique(['unit_cost_assumption_id', 'sort_order']);
            $table->index(['unit_cost_assumption_id', 'section_code']);
            $table->index(['unit_cost_assumption_id', 'row_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_cost_assumption_rows');
    }
};
