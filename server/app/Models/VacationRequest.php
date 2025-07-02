<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VacationRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'arabic_full_name',
        'matricule',
        'echelle',
        'echelon',
        'grade',
        'fonction',
        'arabic_fonction',
        'direction',
        'arabic_direction',
        'address',
        'arabic_address',
        'phone',
        'leave_type',
        'custom_leave_type',
        'arabic_custom_leave_type',
        'duration',
        'arabic_duration',
        'start_date',
        'end_date',
        'with_family',
        'arabic_with_family',
        'interim',
        'arabic_interim',
        'leave_morocco',
        'signature',
        'user_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'leave_morocco' => 'boolean',
    ];
}
