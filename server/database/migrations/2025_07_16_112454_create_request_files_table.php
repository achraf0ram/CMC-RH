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
        Schema::create('request_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('request_id'); // معرف الطلب
            $table->string('request_type'); // نوع الطلب (workCertificate, vacationRequest, ...)
            $table->string('file_path'); // مسار الملف
            $table->string('file_type')->nullable(); // pdf أو image
            $table->unsignedBigInteger('uploaded_by'); // معرف الأدمن
            $table->timestamps();

            // علاقات (اختياري)
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_files');
    }
};
