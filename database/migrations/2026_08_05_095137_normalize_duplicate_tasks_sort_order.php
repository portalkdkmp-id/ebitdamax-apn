<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $usedSortOrders = [];

        DB::table('tasks')
            ->select(['id', 'sort_order'])
            ->whereNotNull('sort_order')
            ->orderBy('id')
            ->lazyById()
            ->each(function (object $task) use (&$usedSortOrders): void {
                $sortOrder = (int) $task->sort_order;

                if (isset($usedSortOrders[$sortOrder])) {
                    DB::table('tasks')
                        ->where('id', $task->id)
                        ->update(['sort_order' => null]);

                    return;
                }

                $usedSortOrders[$sortOrder] = true;
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {}
};
