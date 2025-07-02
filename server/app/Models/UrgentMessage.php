<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UrgentMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'message',
        'is_read',
        'is_replied',
        'admin_reply',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 