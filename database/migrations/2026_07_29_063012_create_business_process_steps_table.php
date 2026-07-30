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
        Schema::create('business_process_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_process_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->unsignedSmallInteger('sequence');
            $table->string('process_group');
            $table->text('detail_process');
            $table->string('pic');
            $table->unsignedSmallInteger('standard_time_minutes');
            $table->text('output_target')->nullable();
            $table->unsignedSmallInteger('responsibility_value')->nullable();
            $table->timestamps();

            $table->unique(['business_process_id', 'sequence']);
            $table->index(['business_process_id', 'process_group']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_process_steps');
    }
};
