<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('episodes', function (Blueprint $table) {
            $table->unsignedBigInteger('compressed_file_size')->nullable()->after('file_size');
            $table->string('compression_status')->nullable()->after('compressed_file_size');
            $table->text('compression_error')->nullable()->after('compression_status');
        });
    }

    public function down(): void
    {
        Schema::table('episodes', function (Blueprint $table) {
            $table->dropColumn([
                'compressed_file_size',
                'compression_status',
                'compression_error',
            ]);
        });
    }
};