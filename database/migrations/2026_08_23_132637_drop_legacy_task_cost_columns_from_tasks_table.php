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
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropColumn([
                'cost_man',
                'cost_machine',
                'cost_method',
                'cost_material',
                'total_plan_cost',
                'total_actual_cost',
                'variable_cost_man',
                'variable_cost_machine',
                'variable_cost_method',
                'variable_cost_material',
                'total_variable_cost',
                'total_actual_variable_cost',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->unsignedBigInteger('cost_man')->default(0);
            $table->unsignedBigInteger('cost_machine')->default(0);
            $table->unsignedBigInteger('cost_method')->default(0);
            $table->unsignedBigInteger('cost_material')->default(0);
            $table->unsignedBigInteger('total_plan_cost')->default(0);
            $table->unsignedBigInteger('total_actual_cost')->default(0);
            $table->unsignedBigInteger('variable_cost_man')->default(0);
            $table->unsignedBigInteger('variable_cost_machine')->default(0);
            $table->unsignedBigInteger('variable_cost_method')->default(0);
            $table->unsignedBigInteger('variable_cost_material')->default(0);
            $table->unsignedBigInteger('total_variable_cost')->default(0);
            $table->unsignedBigInteger('total_actual_variable_cost')->default(0);
        });
    }
};
