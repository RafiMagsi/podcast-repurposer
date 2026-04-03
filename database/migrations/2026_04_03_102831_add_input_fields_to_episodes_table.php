<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('episodes', function (Blueprint $table) {
            $table->string('input_type')->nullable()->after('tone');
            $table->string('media_kind')->nullable()->after('input_type');
            $table->text('source_text')->nullable()->after('media_kind');
        });
    }

    public function down(): void
    {
        Schema::table('episodes', function (Blueprint $table) {
            $table->dropColumn([
                'input_type',
                'media_kind',
                'source_text',
            ]);
        });
    }
};