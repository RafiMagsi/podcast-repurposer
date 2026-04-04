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
            $table->unsignedInteger('run_limit')->default(0)->change();
            $table->decimal('plan_price_usd', 8, 2)->default(0)->change();
        });

        DB::table('users')
            ->where('run_limit', 100)
            ->where('plan_price_usd', 10)
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('billing_purchases')
                    ->whereColumn('billing_purchases.user_id', 'users.id');
            })
            ->update([
                'run_limit' => 0,
                'plan_price_usd' => 0,
            ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('run_limit')->default(100)->change();
            $table->decimal('plan_price_usd', 8, 2)->default(10)->change();
        });
    }
};
