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
        DB::table('tasks')
            ->select([
                'id',
                'cost_man',
                'cost_machine',
                'cost_method',
                'cost_material',
                'variable_cost_man',
                'variable_cost_machine',
                'variable_cost_method',
                'variable_cost_material',
            ])
            ->orderBy('id')
            ->eachById(function (object $task): void {
                DB::table('tasks')
                    ->where('id', $task->id)
                    ->update([
                        'fixed_cost' => $this->encodeCostBreakdown([
                            'man' => $task->cost_man,
                            'machine' => $task->cost_machine,
                            'method' => $task->cost_method,
                            'material' => $task->cost_material,
                        ]),
                        'variable_cost' => $this->encodeCostBreakdown([
                            'man' => $task->variable_cost_man,
                            'machine' => $task->variable_cost_machine,
                            'method' => $task->variable_cost_method,
                            'material' => $task->variable_cost_material,
                        ]),
                    ]);
            }, 100);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('tasks')
            ->select(['id', 'fixed_cost', 'variable_cost'])
            ->orderBy('id')
            ->eachById(function (object $task): void {
                $fixedCost = $this->decodeCostBreakdown($task->fixed_cost);
                $variableCost = $this->decodeCostBreakdown($task->variable_cost);

                DB::table('tasks')
                    ->where('id', $task->id)
                    ->update([
                        'cost_man' => $fixedCost['man'],
                        'cost_machine' => $fixedCost['machine'],
                        'cost_method' => $fixedCost['method'],
                        'cost_material' => $fixedCost['material'],
                        'total_plan_cost' => array_sum($fixedCost),
                        'total_actual_cost' => array_sum($fixedCost),
                        'variable_cost_man' => $variableCost['man'],
                        'variable_cost_machine' => $variableCost['machine'],
                        'variable_cost_method' => $variableCost['method'],
                        'variable_cost_material' => $variableCost['material'],
                        'total_variable_cost' => array_sum($variableCost),
                        'total_actual_variable_cost' => array_sum($variableCost),
                    ]);
            }, 100);
    }

    /**
     * @param  array<string, mixed>  $cost
     */
    private function encodeCostBreakdown(array $cost): string
    {
        return json_encode($this->normalizeCostBreakdown($cost), JSON_THROW_ON_ERROR);
    }

    /**
     * @return array{man: int, machine: int, method: int, material: int}
     */
    private function decodeCostBreakdown(mixed $cost): array
    {
        if (! is_string($cost)) {
            return $this->normalizeCostBreakdown([]);
        }

        try {
            $decodedCost = json_decode($cost, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            $decodedCost = [];
        }

        return $this->normalizeCostBreakdown(
            is_array($decodedCost) ? $decodedCost : [],
        );
    }

    /**
     * @param  array<string, mixed>  $cost
     * @return array{man: int, machine: int, method: int, material: int}
     */
    private function normalizeCostBreakdown(array $cost): array
    {
        return [
            'man' => max(0, (int) ($cost['man'] ?? 0)),
            'machine' => max(0, (int) ($cost['machine'] ?? 0)),
            'method' => max(0, (int) ($cost['method'] ?? 0)),
            'material' => max(0, (int) ($cost['material'] ?? 0)),
        ];
    }
};
