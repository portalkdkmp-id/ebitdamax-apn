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
        Schema::create('organization_calculations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organization_id')
                ->unique()
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->string('source_sheet')->default('Kalkulasi');
            $table->string('classification')->nullable();

            $table->decimal('man_cost', 20, 2)->default(0);
            $table->decimal('method_cost', 20, 2)->default(0);
            $table->decimal('material_cost', 20, 2)->default(0);
            $table->decimal('machine_cost', 20, 2)->default(0);

            $table->decimal('total_cost', 20, 2)->default(0);
            $table->decimal('doc_variable', 20, 2)->default(0);
            $table->decimal('doc_fixed', 20, 2)->default(0);
            $table->decimal('ioc', 20, 2)->default(0);

            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->index('source_sheet');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_calculations');
    }
};
