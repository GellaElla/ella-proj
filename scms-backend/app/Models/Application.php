<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'application_id',
        'name',
        'submitted_at',
        'status',
        'priority',
        'contact',
        'purok',
        'age',
        'birth_date',
        'valid_id_uploaded',
        'birth_certificate_uploaded',
        'proof_residence_uploaded',
        'photo_uploaded',
        'notes',
        'history',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'birth_date' => 'date',
        'age' => 'integer',

        'valid_id_uploaded' => 'boolean',
        'birth_certificate_uploaded' => 'boolean',
        'proof_residence_uploaded' => 'boolean',
        'photo_uploaded' => 'boolean',

        'history' => 'array',
    ];
}