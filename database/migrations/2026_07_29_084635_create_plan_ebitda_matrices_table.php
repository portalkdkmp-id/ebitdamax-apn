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
        Schema::create('plan_ebitda_matrices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_process_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('unit_cost_assumption_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('revenue_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code');
            $table->string('name');
            $table->string('source_sheet');
            $table->timestamps();

            $table->unique(['user_id', 'code']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_ebitda_matrices');
    }
};
