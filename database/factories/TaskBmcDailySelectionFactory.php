<?php

namespace Database\Factories;

use App\Models\BmcPoint;
use App\Models\TaskBmcDailySelection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskBmcDailySelection>
 */
class TaskBmcDailySelectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'bmc_point_id' => BmcPoint::factory(),
            'selection_date' => fake()->date(),
        ];
    }
}
