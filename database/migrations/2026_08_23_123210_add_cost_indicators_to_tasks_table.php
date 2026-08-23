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
        Schema::table('tasks', function (Blueprint $table) {
            $table->unsignedBigInteger('cost_man')->default(0);
            $table->unsignedBigInteger('cost_machine')->default(0);
            $table->unsignedBigInteger('cost_method')->default(0);
            $table->unsignedBigInteger('cost_material')->default(0);
            $table->unsignedBigInteger('total_plan_cost')->default(0);
            $table->unsignedBigInteger('total_actual_cost')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'cost_man',
                'cost_machine',
                'cost_method',
                'cost_material',
                'total_plan_cost',
                'total_actual_cost',
            ]);
        });
    }
};
