<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('mission_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('mission_orders', 'status')) {
                $table->string('status')->default('pending');
            }
            if (!Schema::hasColumn('mission_orders', 'full_name')) {
                $table->string('full_name')->default('');
            }
        });

        DB::table('mission_orders')->update([
            'full_name' => DB::raw('monsieur_madame')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mission_orders', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->dropColumn('full_name');
        });
    }
}; 