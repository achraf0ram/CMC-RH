<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MissionOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'monsieur_madame',
        'matricule',
        'destination',
        'purpose',
        'start_date',
        'end_date',
        'conducteur',
        'conducteur_matricule',
        'start_time',
        'end_time',
        'additional_info',
        'user_id',
        'full_name',
        'type',
    ];
}
