<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->updateMandatoryStatus(true);
    }

    public function down(): void
    {
        $this->updateMandatoryStatus(false);
    }

    private function updateMandatoryStatus(bool $isMandatory): void
    {
        DB::table('tasks')
            ->where('name', 'Penyetoran Struk dan Uang')
            ->whereExists(function ($query): void {
                $query
                    ->selectRaw('1')
                    ->from('task_additional_fields')
                    ->whereColumn('task_additional_fields.task_id', 'tasks.id')
                    ->where('task_additional_fields.field_name', 'rekonsiliasi_uang_masuk');
            })
            ->update([
                'is_mandatory' => $isMandatory,
                'updated_at' => now(),
            ]);
    }
};
