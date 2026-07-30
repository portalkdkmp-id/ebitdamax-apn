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
        Schema::create('unit_cost_assumptions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->date('assumption_date');
            $table->unsignedSmallInteger('days_per_year');
            $table->unsignedSmallInteger('days_per_month');
            $table->decimal('work_hours_per_day', 5, 2);
            $table->string('source_sheet');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_cost_assumptions');
    }
};
