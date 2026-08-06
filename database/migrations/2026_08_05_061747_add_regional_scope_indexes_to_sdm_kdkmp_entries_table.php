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
        Schema::table('sdm_kdkmp_entries', function (Blueprint $table) {
            $table->index(
                ['provinsi', 'kota_kabupaten', 'kecamatan'],
                'sdm_kdkmp_entries_region_hierarchy_index',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sdm_kdkmp_entries', function (Blueprint $table) {
            $table->dropIndex('sdm_kdkmp_entries_region_hierarchy_index');
        });
    }
};
