<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnnualIncome extends Model
{
    use HasFactory;

    protected $fillable = ['full_name', 'matricule', 'file_path', 'status'];
} 