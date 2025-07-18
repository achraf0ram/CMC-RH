<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('work_certificates', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('matricule');
            $table->string('grade')->nullable();
            $table->date('hire_date')->nullable();
            $table->string('function')->nullable();
            $table->string('purpose');
            $table->text('additional_info')->nullable();
            $table->string('file_path')->nullable();
            $table->longBlob('pdf_blob')->nullable();
            $table->string('type')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('work_certificates');
    }
}; 