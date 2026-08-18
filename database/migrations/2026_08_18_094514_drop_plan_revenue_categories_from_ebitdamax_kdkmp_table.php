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
        Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->dropColumn([
                'plan_revenue_makanan',
                'plan_revenue_minuman',
                'plan_revenue_rumahan',
                'plan_revenue_subsidi',
                'plan_revenue_expenses',
                'plan_revenue_obat_obatan',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->decimal('plan_revenue_makanan', 20, 2)->nullable();
            $table->decimal('plan_revenue_minuman', 20, 2)->nullable();
            $table->decimal('plan_revenue_rumahan', 20, 2)->nullable();
            $table->decimal('plan_revenue_subsidi', 20, 2)->nullable();
            $table->decimal('plan_revenue_expenses', 20, 2)->nullable();
            $table->decimal('plan_revenue_obat_obatan', 20, 2)->nullable();
        });
    }
};
