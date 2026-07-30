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
        Schema::create('meeting_minute_item_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_minute_item_id')
                ->constrained('meeting_minute_items')
                ->cascadeOnDelete();
            $table->string('from_status');
            $table->string('to_status');
            $table->text('note')->nullable();
            $table->foreignId('changed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('changed_by_name');
            $table->timestamp('created_at')->useCurrent();

            $table->index(
                ['meeting_minute_item_id', 'created_at'],
                'meeting_item_status_history_timeline'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_minute_item_status_histories');
    }
};
