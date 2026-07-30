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
        Schema::table('unit_cost_assumptions', function (Blueprint $table) {
            $table->dropUnique('unit_cost_assumptions_code_unique');
            $table->dropIndex('unit_cost_assumptions_user_id_code_index');
            $table->unique(['user_id', 'code'], 'unit_cost_assumptions_user_code_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unit_cost_assumptions', function (Blueprint $table) {
            $table->dropUnique('unit_cost_assumptions_user_code_unique');
            $table->unique('code');
            $table->index(['user_id', 'code']);
        });
    }
};
