<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkCertificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'matricule',
        'grade',
        'hire_date',
        'function',
        'purpose',
        'additional_info',
    ];
} 