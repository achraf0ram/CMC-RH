<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            AdminUserSeeder::class,
        ]);

        DB::statement("UPDATE vacation_requests SET type = 'vacationRequest' WHERE type IS NULL OR type = '';");
        DB::statement("UPDATE work_certificates SET type = 'workCertificate' WHERE type IS NULL OR type = '';");
        DB::statement("UPDATE mission_orders SET type = 'missionOrder' WHERE type IS NULL OR type = '';");
        DB::statement("UPDATE salary_domiciliations SET type = 'salaryDomiciliation' WHERE type IS NULL OR type = '';");
        DB::statement("UPDATE annual_incomes SET type = 'annualIncome' WHERE type IS NULL OR type = '';");
    }
}
