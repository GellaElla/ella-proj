<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('burial_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->nullable()->unique();
            $table->string('senior_name');
            $table->string('claimant_name');
            $table->string('senior_id')->nullable();
            $table->string('purok')->nullable();
            $table->string('contact')->nullable();
            $table->date('request_date');
            $table->string('status')->default('Pending');
            $table->string('relationship')->nullable();
            $table->date('release_date')->nullable();
            $table->string('received_by')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('burial_requests');
    }
};