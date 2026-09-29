<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
    'reference',
    'senior_name',
    'senior_id',
    'purok',
    'contact',
    'assistance_type',
    'request_date',
    'facility',
    'status',
    'completed_date',
    'received_by',
    'remarks',
];

    protected $casts = [
        'request_date' => 'date',
        'completed_date' => 'date',
    ];
}