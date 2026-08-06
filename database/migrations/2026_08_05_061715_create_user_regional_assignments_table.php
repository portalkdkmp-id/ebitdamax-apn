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
        Schema::create('user_regional_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('scope_level', 32);
            $table->string('provinsi');
            $table->string('kota_kabupaten')->nullable();
            $table->string('kecamatan')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'scope_level']);
            $table->index(['provinsi', 'kota_kabupaten', 'kecamatan']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_regional_assignments');
    }
};
