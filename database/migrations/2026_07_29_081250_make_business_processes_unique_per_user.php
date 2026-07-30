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
        Schema::table('business_processes', function (Blueprint $table) {
            $table->dropUnique('business_processes_code_unique');
            $table->dropIndex('business_processes_user_id_code_index');
            $table->unique(['user_id', 'code'], 'business_processes_user_code_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_processes', function (Blueprint $table) {
            $table->dropUnique('business_processes_user_code_unique');
            $table->unique('code');
            $table->index(['user_id', 'code']);
        });
    }
};
