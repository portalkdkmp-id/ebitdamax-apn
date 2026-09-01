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
        Schema::create('customer_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('occupation_role', 50);
            $table->string('occupation_other')->nullable();
            $table->unsignedSmallInteger('age');
            $table->string('gender', 20);
            $table->text('interview_purpose');
            $table->text('summary');
            $table->unsignedTinyInteger('sentiment')->default(3);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_analyses');
    }
};
