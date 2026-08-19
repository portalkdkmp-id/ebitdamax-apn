<?php

namespace Database\Seeders;

use App\Models\BmcPoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BmcPointSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $points = [
            'Key Partnerships',
            'Key Activities',
            'Key Resources',
            'Value Propositions',
            'Customer Relationships',
            'Channels',
            'Customer Segments',
            'Cost Structure',
            'Revenue Streams',
        ];

        foreach ($points as $name) {
            BmcPoint::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'description' => null],
            );
        }
    }
}
