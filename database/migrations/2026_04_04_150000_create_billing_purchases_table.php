<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->default('stripe');
            $table->string('provider_session_id')->unique();
            $table->string('provider_payment_status')->nullable();
            $table->string('status')->default('pending');
            $table->string('currency', 8)->default('usd');
            $table->unsignedInteger('amount_cents');
            $table->unsignedInteger('runs_purchased');
            $table->json('payload')->nullable();
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_purchases');
    }
};
