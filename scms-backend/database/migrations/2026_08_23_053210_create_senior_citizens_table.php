<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('senior_citizens', function (Blueprint $table) {
            $table->id();

            $table->string('senior_id')->unique();
            $table->string('name');
            $table->unsignedInteger('age');
            $table->string('gender');
            $table->string('purok');
            $table->string('contact')->nullable();

            $table->string('status')->default('Active');

            $table->string('blood_type')->nullable();
            $table->string('condition')->nullable();
            $table->string('maintenance')->nullable();
            $table->date('last_checkup')->nullable();

            $table->string('civil_status')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('relationship')->nullable();
            $table->string('osca_id')->default('Active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('senior_citizens');
    }
};