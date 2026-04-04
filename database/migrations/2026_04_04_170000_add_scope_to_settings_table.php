<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('scope_type')->default('project')->after('id');
            $table->unsignedBigInteger('scope_id')->default(0)->after('scope_type');
        });

        DB::table('settings')->update([
            'scope_type' => 'project',
            'scope_id' => 0,
        ]);

        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique(['key']);
            $table->unique(['scope_type', 'scope_id', 'key'], 'settings_scope_unique');
            $table->index(['key', 'scope_type', 'scope_id'], 'settings_lookup_index');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique('settings_scope_unique');
            $table->dropIndex('settings_lookup_index');
        });

        DB::table('settings')
            ->where('scope_type', '!=', 'project')
            ->delete();

        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['scope_type', 'scope_id']);
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->unique('key');
        });
    }
};
