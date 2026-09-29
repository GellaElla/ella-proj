<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('medical_requests', 'reference')) {
            Schema::table('medical_requests', function (Blueprint $table) {
                $table->string('reference')
                    ->nullable()
                    ->unique()
                    ->after('id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('medical_requests', 'reference')) {
            Schema::table('medical_requests', function (Blueprint $table) {
                $table->dropUnique('medical_requests_reference_unique');
                $table->dropColumn('reference');
            });
        }
    }
};