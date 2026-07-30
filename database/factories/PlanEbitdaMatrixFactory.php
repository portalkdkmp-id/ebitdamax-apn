<?php

namespace Database\Factories;

use App\Models\PlanEbitdaMatrix;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlanEbitdaMatrix>
 */
class PlanEbitdaMatrixFactory extends Factory
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
            'code' => fake()->unique()->slug(2),
            'name' => fake()->words(3, true),
            'source_sheet' => '4. PLAN EBITDA MATRIX',
        ];
    }
}
