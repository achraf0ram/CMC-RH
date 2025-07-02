<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_admin')) {
                $table->boolean('is_admin')->default(false);
            }
        });

        $tables = ['work_certificates', 'vacation_requests', 'salary_domiciliations', 'annual_incomes'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                if (!Schema::hasColumn($table->getTable(), 'status')) {
                    $table->string('status')->default('pending');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });

        $tables = ['work_certificates', 'vacation_requests', 'salary_domiciliations', 'annual_incomes'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
}; 