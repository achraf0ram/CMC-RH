<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('salary_domiciliations', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
        Schema::table('annual_incomes', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
    }

    public function down()
    {
        Schema::table('salary_domiciliations', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
        Schema::table('annual_incomes', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }
}; 