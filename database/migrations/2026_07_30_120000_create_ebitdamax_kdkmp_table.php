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
        Schema::create('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sdm_kdkmp_entry_id')
                ->constrained('sdm_kdkmp_entries')
                ->restrictOnDelete();
            $table->date('report_date');
            $table->decimal('target_revenue', 20, 2)->nullable();
            $table->decimal('actual_revenue', 20, 2)->nullable();
            $table->decimal('cost', 20, 2)->nullable();
            $table->unsignedInteger('total_duration_minutes')->nullable();
            $table->decimal('performance_score', 5, 2)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(
                ['sdm_kdkmp_entry_id', 'report_date'],
                'ebitdamax_kdkmp_entry_date_unique'
            );
            $table->index('report_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ebitdamax_kdkmp');
    }
};
