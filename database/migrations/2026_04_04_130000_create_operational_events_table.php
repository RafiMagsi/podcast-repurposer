<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operational_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_type');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('content_request_id')->nullable();
            $table->string('source_type')->nullable();
            $table->string('content_type')->nullable();
            $table->string('status')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['event_type', 'created_at']);
            $table->index('source_type');
            $table->index('content_type');
            $table->index('status');
            $table->index('content_request_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operational_events');
    }
};
