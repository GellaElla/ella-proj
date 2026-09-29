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
        Schema::create('applications', function (Blueprint $table) {
    $table->id();

    $table->string('application_id')->unique();
    $table->string('name');
    $table->dateTime('submitted_at');

    $table->string('status')->default('Pending');
    $table->string('priority')->default('Low');

    $table->string('contact')->nullable();
    $table->string('purok')->nullable();
    $table->unsignedInteger('age')->nullable();
    $table->date('birth_date')->nullable();

    $table->boolean('valid_id_uploaded')->default(false);
    $table->boolean('birth_certificate_uploaded')->default(false);
    $table->boolean('proof_residence_uploaded')->default(false);
    $table->boolean('photo_uploaded')->default(false);

    $table->text('notes')->nullable();

    $table->json('history')->nullable();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
