<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->boolean('plan_revenue_requires_review')
                ->default(false)
                ->after('plan_revenue')
                ->index();
        });

        DB::table('ebitdamax_kdkmp')
            ->select(['id', 'plan_revenue'])
            ->whereNotNull('plan_revenue')
            ->orderBy('id')
            ->chunkById(500, function ($entries): void {
                foreach ($entries as $entry) {
                    if (is_numeric($entry->plan_revenue) && (float) $entry->plan_revenue < 20_000_000) {
                        DB::table('ebitdamax_kdkmp')
                            ->where('id', $entry->id)
                            ->update(['plan_revenue_requires_review' => true]);
                    }
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->dropColumn('plan_revenue_requires_review');
        });
    }
};
