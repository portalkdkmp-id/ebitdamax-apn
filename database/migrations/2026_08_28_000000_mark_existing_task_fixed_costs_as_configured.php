<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const CONFIGURED_KEY = '_configured';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->updateConfigurationMarker(true);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->updateConfigurationMarker(false);
    }

    private function updateConfigurationMarker(bool $isConfigured): void
    {
        DB::table('tasks')
            ->select(['id', 'fixed_cost'])
            ->orderBy('id')
            ->eachById(function (object $task) use ($isConfigured): void {
                $fixedCost = $this->decodeJsonObject($task->fixed_cost);

                if ($isConfigured) {
                    $fixedCost[self::CONFIGURED_KEY] = true;
                } else {
                    unset($fixedCost[self::CONFIGURED_KEY]);
                }

                DB::table('tasks')
                    ->where('id', $task->id)
                    ->update([
                        'fixed_cost' => json_encode($fixedCost, JSON_THROW_ON_ERROR),
                    ]);
            }, 100);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJsonObject(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_object($value)) {
            return get_object_vars($value);
        }

        if (! is_string($value)) {
            return $this->emptyCostBreakdown();
        }

        try {
            $decoded = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return $this->emptyCostBreakdown();
        }

        return is_array($decoded) ? $decoded : $this->emptyCostBreakdown();
    }

    /**
     * @return array{man: int, machine: int, method: int, material: int}
     */
    private function emptyCostBreakdown(): array
    {
        return [
            'man' => 0,
            'machine' => 0,
            'method' => 0,
            'material' => 0,
        ];
    }
};
