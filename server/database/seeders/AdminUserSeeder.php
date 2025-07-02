<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'cmc.rh.ram@gmail.com'],
            [
            'name' => 'Admin',
            'password' => Hash::make('123456789'),
                'is_admin' => 1,
            ]
        );
    }
} 