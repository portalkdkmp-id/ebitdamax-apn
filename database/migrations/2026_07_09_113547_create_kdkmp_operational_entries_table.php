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
        Schema::create('kdkmp_operational_entries', function (Blueprint $table) {
            $table->id();
            $table->string('nik')->nullable()->unique();
            $table->string('nama_kdkmp');
            $table->string('provinsi')->nullable();
            $table->string('kota_kabupaten')->nullable();
            $table->string('kecamatan')->nullable();
            $table->boolean('has_po')->default(false);
            $table->boolean('has_receipt')->default(false);
            $table->boolean('has_sales')->default(false);
            $table->string('po_raw')->nullable();
            $table->string('receipt_raw')->nullable();
            $table->string('sales_raw')->nullable();
            $table->string('source_file')->nullable();
            $table->timestamp('imported_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->index('nama_kdkmp');
            $table->index(['has_po', 'has_receipt', 'has_sales']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kdkmp_operational_entries');
    }
};
