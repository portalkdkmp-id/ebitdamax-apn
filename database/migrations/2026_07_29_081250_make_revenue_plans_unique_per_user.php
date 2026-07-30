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
        Schema::table('revenue_plans', function (Blueprint $table) {
            $table->dropUnique('revenue_plans_code_unique');
            $table->unique(['user_id', 'code'], 'revenue_plans_user_code_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('revenue_plans', function (Blueprint $table) {
            $table->dropUnique('revenue_plans_user_code_unique');
            $table->unique('code');
        });
    }
};
