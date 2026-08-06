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
        if (Schema::hasIndex('tasks', ['sort_order'], 'unique')) {
            return;
        }

        if (Schema::hasIndex('tasks', 'tasks_sort_order_index')) {
            Schema::table('tasks', function (Blueprint $table): void {
                $table->dropIndex('tasks_sort_order_index');
            });
        }

        Schema::table('tasks', function (Blueprint $table): void {
            $table->unique('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {}
};
