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
        $missingColumns = collect(['has_po', 'has_receipt', 'has_sales'])
            ->reject(fn (string $column): bool => Schema::hasColumn('koperasi_sarpras_status_points', $column))
            ->values();

        if ($missingColumns->isNotEmpty()) {
            Schema::table('koperasi_sarpras_status_points', function (Blueprint $table) use ($missingColumns): void {
                if ($missingColumns->contains('has_po')) {
                    $table->boolean('has_po')->default(false)->after('sarpras_lengkap');
                }

                if ($missingColumns->contains('has_receipt')) {
                    $table->boolean('has_receipt')->default(false)->after('has_po');
                }

                if ($missingColumns->contains('has_sales')) {
                    $table->boolean('has_sales')->default(false)->after('has_receipt');
                }
            });
        }

        Schema::dropIfExists('kdkmp_operational_entries');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $existingColumns = collect(['has_po', 'has_receipt', 'has_sales'])
            ->filter(fn (string $column): bool => Schema::hasColumn('koperasi_sarpras_status_points', $column))
            ->values()
            ->all();

        if ($existingColumns !== []) {
            Schema::table('koperasi_sarpras_status_points', function (Blueprint $table) use ($existingColumns): void {
                $table->dropColumn($existingColumns);
            });
        }
    }
};
