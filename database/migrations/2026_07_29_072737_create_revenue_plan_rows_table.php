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
        Schema::create('revenue_plan_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('revenue_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order');
            $table->string('row_type');
            $table->unsignedSmallInteger('display_number')->nullable();
            $table->text('revenue_service')->nullable();
            $table->decimal('planned_volume', 12, 3)->nullable();
            $table->string('unit')->nullable();
            $table->decimal('rate', 20, 2)->nullable();
            $table->decimal('planned_revenue', 20, 2)->nullable();
            $table->timestamps();

            $table->unique(['revenue_plan_id', 'sort_order']);
            $table->index(['revenue_plan_id', 'row_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('revenue_plan_rows');
    }
};
