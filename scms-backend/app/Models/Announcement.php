<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title',
        'date',
        'description',
        'status',
        'pinned',
        'icon_index',
    ];

    protected $casts = [
        'date' => 'date',
        'pinned' => 'boolean',
        'icon_index' => 'integer',
    ];
}