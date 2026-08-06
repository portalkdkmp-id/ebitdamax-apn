<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('roles')
            ->whereIn('slug', [
                'ebitda_kdkmp',
                'kepala-toko-manager',
                'manager-wilayah',
            ])
            ->update(['domain' => 'kdkmp']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('roles')
            ->whereIn('slug', [
                'ebitda_kdkmp',
                'kepala-toko-manager',
                'manager-wilayah',
            ])
            ->update(['domain' => 'apn']);
    }
};
