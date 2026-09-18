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
        Schema::table('plan_ebitda_matrix_processes', function (Blueprint $table): void {
            $table->dropForeign(['business_process_step_id']);
            $table->dropColumn('business_process_step_id');
        });

        Schema::table('plan_ebitda_matrix_rows', function (Blueprint $table): void {
            $table->dropForeign(['unit_cost_assumption_row_id']);
            $table->dropColumn('unit_cost_assumption_row_id');
        });

        Schema::table('plan_ebitda_matrices', function (Blueprint $table): void {
            $table->dropForeign(['business_process_id']);
            $table->dropForeign(['unit_cost_assumption_id']);
            $table->dropForeign(['revenue_plan_id']);
            $table->dropColumn([
                'business_process_id',
                'unit_cost_assumption_id',
                'revenue_plan_id',
            ]);
        });

        Schema::dropIfExists('business_process_steps');
        Schema::dropIfExists('business_processes');
        Schema::dropIfExists('unit_cost_assumption_rows');
        Schema::dropIfExists('unit_cost_assumptions');
        Schema::dropIfExists('revenue_plan_rows');
        Schema::dropIfExists('revenue_plans');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        throw new RuntimeException(
            'Penghapusan fitur Excel KDKMP bersifat permanen. Pulihkan dari backup database bila diperlukan.'
        );
    }
};
