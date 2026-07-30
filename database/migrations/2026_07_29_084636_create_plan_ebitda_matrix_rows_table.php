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
        Schema::create('plan_ebitda_matrix_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_ebitda_matrix_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_cost_assumption_row_id')->nullable()->constrained()->nullOnDelete();
            $table->string('section_code', 10);
            $table->unsignedSmallInteger('sort_order');
            $table->string('row_type');
            $table->text('label');
            $table->json('values');
            $table->string('total')->nullable();
            $table->text('notes')->nullable();
            $table->string('notes_tone')->nullable();
            $table->boolean('is_calculated')->default(false);
            $table->unsignedTinyInteger('source_page');
            $table->timestamps();

            $table->unique(['plan_ebitda_matrix_id', 'sort_order']);
            $table->index(['plan_ebitda_matrix_id', 'section_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_ebitda_matrix_rows');
    }
};
