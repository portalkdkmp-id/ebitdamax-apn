<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const EMPTY_COST_BREAKDOWN = '{"man":0,"machine":0,"method":0,"material":0}';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->jsonb('fixed_cost')->default(self::EMPTY_COST_BREAKDOWN);
            $table->jsonb('variable_cost')->default(self::EMPTY_COST_BREAKDOWN);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropColumn(['fixed_cost', 'variable_cost']);
        });
    }
};
