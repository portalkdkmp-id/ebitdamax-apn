<?php

namespace Database\Factories;

use App\Models\BmcPoint;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BmcPoint>
 */
class BmcPointFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'slug' => fake()->unique()->slug(2),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
