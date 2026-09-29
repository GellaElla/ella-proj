<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeniorCitizen extends Model
{
    protected $fillable = [
        'senior_id',
        'name',
        'age',
        'birth_date',
        'gender',
        'purok',
        'contact',
        'status',
        'blood_type',
        'condition',
        'maintenance',
        'last_checkup',
        'civil_status',
        'emergency_contact',
        'relationship',
        'osca_id',
    ];

    protected $casts = [
        'age' => 'integer',
        'last_checkup' => 'date',
        
    ];
}