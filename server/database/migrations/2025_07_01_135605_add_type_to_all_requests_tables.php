<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('vacation_requests', 'type')) {
            Schema::table('vacation_requests', function (Blueprint $table) {
                $table->string('type')->nullable();
            });
        }
        if (!Schema::hasColumn('work_certificates', 'type')) {
            Schema::table('work_certificates', function (Blueprint $table) {
                $table->string('type')->nullable();
            });
        }
        if (!Schema::hasColumn('mission_orders', 'type')) {
            Schema::table('mission_orders', function (Blueprint $table) {
                $table->string('type')->nullable();
            });
        }
        if (!Schema::hasColumn('salary_domiciliations', 'type')) {
            Schema::table('salary_domiciliations', function (Blueprint $table) {
                $table->string('type')->nullable();
            });
        }
        if (!Schema::hasColumn('annual_incomes', 'type')) {
            Schema::table('annual_incomes', function (Blueprint $table) {
                $table->string('type')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('vacation_requests', 'type')) {
            Schema::table('vacation_requests', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
        if (Schema::hasColumn('work_certificates', 'type')) {
            Schema::table('work_certificates', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
        if (Schema::hasColumn('mission_orders', 'type')) {
            Schema::table('mission_orders', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
        if (Schema::hasColumn('salary_domiciliations', 'type')) {
            Schema::table('salary_domiciliations', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
        if (Schema::hasColumn('annual_incomes', 'type')) {
            Schema::table('annual_incomes', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
    }
};
