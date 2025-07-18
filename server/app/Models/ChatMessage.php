<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'from_user_id',
        'to_user_id',
        'message',
        'is_urgent',
        'is_read',
        'image_path',
        'file_path',
        'file_type',
    ];

    // علاقة: مرسل الرسالة
    public function sender()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    // علاقة: مستقبل الرسالة
    public function receiver()
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }
} 