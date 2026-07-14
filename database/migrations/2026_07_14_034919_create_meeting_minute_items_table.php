<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meeting_minute_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_minute_id')->constrained('meeting_minutes')->cascadeOnDelete();
            $table->string('subject');
            $table->text('description')->nullable();
            $table->text('action')->nullable();
            $table->text('objectives')->nullable();
            $table->date('date_start')->nullable();
            $table->date('date_finish')->nullable();
            $table->string('pic')->nullable();
            $table->string('status')->default('open');
            $table->text('remarks')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_minute_items');
    }
};
