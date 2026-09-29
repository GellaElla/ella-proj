<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('burial_requests', function (Blueprint $table) {
            $table->date('death_date')->nullable()->after('senior_id');
            $table->string('funeral_home')->nullable()->after('contact');
        });
    }

    public function down(): void
    {
        Schema::table('burial_requests', function (Blueprint $table) {
            $table->dropColumn(['death_date', 'funeral_home']);
        });
    }
};