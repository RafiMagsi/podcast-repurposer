<?php

use App\Models\Episode;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('episodes', 'public_id')) {
            Schema::table('episodes', function (Blueprint $table) {
                $table->string('public_id', 26)->nullable()->unique()->after('id');
            });
        }

        Episode::query()
            ->whereNull('public_id')
            ->chunkById(100, function ($episodes) {
                foreach ($episodes as $episode) {
                    $episode->updateQuietly([
                        'public_id' => (string) Str::ulid(),
                    ]);
                }
            });

        // Skip change() for sqlite safety
    }

    public function down(): void
    {
        if (Schema::hasColumn('episodes', 'public_id')) {
            Schema::table('episodes', function (Blueprint $table) {
                $table->dropColumn('public_id');
            });
        }
    }
};