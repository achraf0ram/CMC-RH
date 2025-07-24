<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // حذف الجدول بالكامل إذا كان موجودًا
        Schema::dropIfExists('chat_messages');
        // إعادة إنشاء الجدول من جديد
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('from_user_id');
            $table->unsignedBigInteger('to_user_id');
            $table->text('message')->nullable();
            $table->timestamps();
        });
    }

    // احذف دالة down بالكامل لأنها تسبب الخطأ
}; 