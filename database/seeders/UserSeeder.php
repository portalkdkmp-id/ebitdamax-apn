<?php

namespace Database\Seeders;

use App\Enums\RoleLevel;
use App\Models\Role;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::create([
            'name' => 'superadmin',
            'slug' => 'superadmin',
            'level' => RoleLevel::Superadmin,
        ]);

        Role::create([
            'name' => 'Staff',
            'slug' => 'staff',
            'level' => RoleLevel::Staff,
        ]);

        \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'superadmin@mail.com',
            'password' => bcrypt('password'),
            'role_id' => Role::where('name', 'superadmin')->first()->id,
        ]);
    }
}
