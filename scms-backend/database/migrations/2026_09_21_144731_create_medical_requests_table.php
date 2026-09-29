<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('medical_requests', function (Blueprint $table) {
        $table->id();
        $table->string('senior_name');
        $table->string('senior_id');
        $table->string('purok')->nullable();
        $table->string('contact')->nullable();
        $table->string('assistance_type')->default('Medicine');
        $table->date('request_date');
        $table->string('facility')->nullable();
        $table->string('status')->default('Pending');
        $table->date('completed_date')->nullable();
        $table->string('received_by')->nullable();
        $table->text('remarks')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_requests');
    }
};
