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
        Schema::table('ebitdamax_kdkmp', function (Blueprint $table): void {
            $table->string('actual_variable_cost')->nullable()->after('actual_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ebitdamax_kdkmp', function (Blueprint $table): void {
            $table->dropColumn('actual_variable_cost');
        });
    }
};
