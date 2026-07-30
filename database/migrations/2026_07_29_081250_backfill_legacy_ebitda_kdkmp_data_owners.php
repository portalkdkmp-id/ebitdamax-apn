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
        $ownerId = DB::table('users')
            ->where('email', 'kdkmp.gerai@ebitdamax.local')
            ->value('id');

        if ($ownerId === null) {
            return;
        }

        foreach (['business_processes', 'unit_cost_assumptions', 'revenue_plans'] as $table) {
            DB::table($table)
                ->whereNull('user_id')
                ->where('code', 'kdkmp-gerai')
                ->update(['user_id' => $ownerId]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * Ownership corrections are intentionally retained during rollback.
     */
    public function down(): void {}
};
