<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryDomiciliation extends Model
{
    use HasFactory;

    protected $fillable = ['full_name', 'matricule', 'file_path', 'status', 'user_id'];
} 