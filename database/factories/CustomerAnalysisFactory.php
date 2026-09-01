<?php

namespace Database\Factories;

use App\Models\CustomerAnalysis;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CustomerAnalysis>
 */
class CustomerAnalysisFactory extends Factory
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
            'full_name' => fake()->name(),
            'occupation_role' => CustomerAnalysis::OCCUPATION_FARMER,
            'occupation_other' => null,
            'age' => fake()->numberBetween(18, 75),
            'gender' => fake()->randomElement([
                CustomerAnalysis::GENDER_MALE,
                CustomerAnalysis::GENDER_FEMALE,
            ]),
            'interview_purpose' => fake()->sentence(),
            'summary' => fake()->paragraph(),
            'sentiment' => fake()->numberBetween(1, 5),
        ];
    }
}
