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
        Schema::table('mission_orders', function (Blueprint $table) {
            // فقط أضف حقل type إذا لم يكن موجودًا
            if (!Schema::hasColumn('mission_orders', 'type')) {
                $table->string('type')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mission_orders', function (Blueprint $table) {
            if (Schema::hasColumn('mission_orders', 'type')) {
                $table->dropColumn('type');
            }
        });
    }
};
