<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            OrganizationSeeder::class,
            OrganizationProfileSeeder::class,
            OrganizationCalculationSeeder::class,
            EbitdaValueSeeder::class,
        ]);
    }
}
