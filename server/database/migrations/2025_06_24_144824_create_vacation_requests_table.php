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
        Schema::create('vacation_requests', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('arabic_full_name')->nullable();
            $table->string('matricule');
            $table->string('echelle')->nullable();
            $table->string('echelon')->nullable();
            $table->string('grade')->nullable();
            $table->string('fonction')->nullable();
            $table->string('arabic_fonction')->nullable();
            $table->string('direction')->nullable();
            $table->string('arabic_direction')->nullable();
            $table->string('address')->nullable();
            $table->string('arabic_address')->nullable();
            $table->string('phone')->nullable();
            $table->string('leave_type');
            $table->string('custom_leave_type')->nullable();
            $table->string('arabic_custom_leave_type')->nullable();
            $table->string('duration');
            $table->string('arabic_duration')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('with_family')->nullable();
            $table->string('arabic_with_family')->nullable();
            $table->string('interim')->nullable();
            $table->string('arabic_interim')->nullable();
            $table->boolean('leave_morocco')->default(false);
            $table->string('signature_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vacation_requests');
    }
};
