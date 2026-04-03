<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('run_limit')->default(100)->after('password');
            $table->decimal('plan_price_usd', 8, 2)->default(10)->after('run_limit');
        });

        DB::table('users')
            ->whereNull('run_limit')
            ->update([
                'run_limit' => 100,
                'plan_price_usd' => 10,
            ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['run_limit', 'plan_price_usd']);
        });
    }
};
