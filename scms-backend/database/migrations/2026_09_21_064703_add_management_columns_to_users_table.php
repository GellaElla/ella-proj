<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hadRole = Schema::hasColumn('users', 'role');

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->unique();
            }

            if (! Schema::hasColumn('users', 'role')) {
                // Two roles only: "Administrator" and "User".
                $table->string('role')->default('User');
            }

            if (! Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('Active');
            }

            if (! Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable();
            }
        });

        // Existing accounts (like "admin") get a username from their name.
        DB::table('users')->whereNull('username')->update([
            'username' => DB::raw('name'),
        ]);

        // Every account that already exists becomes an Administrator so
        // nobody is locked out of User Management. Change this if some of
        // your existing accounts should be regular users.
        if (! $hadRole) {
            DB::table('users')->update(['role' => 'Administrator']);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['username', 'role', 'status', 'last_login_at'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    if ($column === 'username') {
                        $table->dropUnique(['username']);
                    }
                    $table->dropColumn($column);
                }
            }
        });
    }
};