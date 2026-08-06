<?php

namespace Database\Factories;

use App\Enums\RegionalScopeLevel;
use App\Models\User;
use App\Models\UserRegionalAssignment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserRegionalAssignment>
 */
class UserRegionalAssignmentFactory extends Factory
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
            'scope_level' => RegionalScopeLevel::District,
            'provinsi' => fake()->state(),
            'kota_kabupaten' => fake()->city(),
            'kecamatan' => fake()->citySuffix(),
        ];
    }
}
