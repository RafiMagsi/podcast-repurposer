<?php

use App\Exceptions\DestructiveDatabaseCommandBlockedException;
use App\Support\DatabaseSafetyGuard;
use Illuminate\Support\Facades\DB;

it('blocks destructive database refresh commands', function () {
    $guard = app(DatabaseSafetyGuard::class);

    expect(fn () => $guard->ensureCommandIsAllowed('migrate:fresh'))
        ->toThrow(
            DestructiveDatabaseCommandBlockedException::class,
            'Blocked destructive database command [migrate:fresh].'
        );

    expect(fn () => $guard->ensureCommandIsAllowed('db:wipe'))
        ->toThrow(
            DestructiveDatabaseCommandBlockedException::class,
            'Blocked destructive database command [db:wipe].'
        );
});

it('allows safe database console commands', function () {
    $guard = app(DatabaseSafetyGuard::class);

    expect(fn () => $guard->ensureCommandIsAllowed('migrate'))->not->toThrow(Throwable::class);
    expect(fn () => $guard->ensureCommandIsAllowed('queue:work'))->not->toThrow(Throwable::class);
});

it('still allows safe database writes inside test transactions', function () {
    DB::table('settings')->insert([
        'key' => 'database_safety_test',
        'value' => 'ok',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    expect(DB::table('settings')->where('key', 'database_safety_test')->exists())->toBeTrue();
});
