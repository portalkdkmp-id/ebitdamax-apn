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
        Schema::create('koperasi_sarpras_status_points', function (Blueprint $table) {
            $table->id();
            $table->string('nik')->nullable();
            $table->string('nama_koperasi')->nullable();
            $table->string('provinsi')->nullable();
            $table->string('kota_kabupaten')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('desa')->nullable();
            $table->string('kodim')->nullable();
            $table->decimal('lat', 10, 6);
            $table->decimal('lng', 10, 6);
            $table->string('validation_status')->nullable();
            $table->decimal('progress_percentage', 5, 1)->default(0);
            $table->string('batch')->nullable();
            $table->unsignedInteger('completed_sarpras_count')->default(0);
            $table->boolean('sarpras_less_than_6')->default(true);
            $table->boolean('sarpras_primary_lengkap')->default(false);
            $table->boolean('sarpras_secondary_lengkap')->default(false);
            $table->boolean('sarpras_lengkap')->default(false);
            $table->boolean('has_po')->default(false);
            $table->boolean('has_receipt')->default(false);
            $table->boolean('has_sales')->default(false);
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->unique(['nik', 'lat', 'lng'], 'koperasi_point_unique');
            $table->index('nik');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('koperasi_sarpras_status_points');
    }
};
