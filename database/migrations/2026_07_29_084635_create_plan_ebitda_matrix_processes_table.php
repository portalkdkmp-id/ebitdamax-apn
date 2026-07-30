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
        Schema::create('plan_ebitda_matrix_processes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_ebitda_matrix_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_process_step_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('sequence');
            $table->string('process_group');
            $table->text('detail_process');
            $table->string('unit_name')->nullable();
            $table->string('pic');
            $table->timestamps();

            $table->unique(['plan_ebitda_matrix_id', 'sequence']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_ebitda_matrix_processes');
    }
};
