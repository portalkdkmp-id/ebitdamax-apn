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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('sdm_kdkmp_entry_id')
                ->nullable()
                ->unique()
                ->after('role_id')
                ->constrained('sdm_kdkmp_entries')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['sdm_kdkmp_entry_id']);
            $table->dropUnique(['sdm_kdkmp_entry_id']);
            $table->dropColumn('sdm_kdkmp_entry_id');
        });
    }
};
