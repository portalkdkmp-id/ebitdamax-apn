<?php

namespace Database\Factories;

use App\Enums\TaskAdditionalFieldInputType;
use App\Enums\TaskAdditionalFieldShowWhen;
use App\Models\TaskAdditionalField;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TaskAdditionalField>
 */
class TaskAdditionalFieldFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = fake()->unique()->words(2, true);

        return [
            'uuid' => (string) Str::uuid(),
            'label' => Str::headline($label),
            'field_name' => Str::slug($label, '_'),
            'input_type' => TaskAdditionalFieldInputType::Text->value,
            'show_when' => TaskAdditionalFieldShowWhen::Start->value,
            'is_required' => false,
            'sort_order' => 0,
            'options' => null,
        ];
    }
}
