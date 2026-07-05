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
        Schema::table('ebitda_values', function (Blueprint $table) {
            $table->string('classification')->nullable()->after('source_sheet');

            $table->decimal('man_cost', 20, 2)->default(0)->after('classification');
            $table->decimal('method_cost', 20, 2)->default(0)->after('man_cost');
            $table->decimal('material_cost', 20, 2)->default(0)->after('method_cost');
            $table->decimal('machine_cost', 20, 2)->default(0)->after('material_cost');
        });
    }

    public function down(): void
    {
        Schema::table('ebitda_values', function (Blueprint $table) {
            $table->dropColumn([
                'classification',
                'man_cost',
                'method_cost',
                'material_cost',
                'machine_cost',
            ]);
        });
    }
};
