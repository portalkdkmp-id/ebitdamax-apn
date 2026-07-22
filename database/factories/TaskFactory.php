<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\Task;
use App\Models\TaskCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'task_category_id' => TaskCategory::factory(),
            'role_id' => Role::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'time_require' => fake()->numberBetween(15, 240),
            'is_active' => true,
        ];
    }
}
