<?php

namespace App\Support;

use App\Exceptions\DestructiveDatabaseCommandBlockedException;

class DatabaseSafetyGuard
{
    /**
     * @var list<string>
     */
    private const BLOCKED_DATABASE_COMMANDS = [
        'db:wipe',
        'migrate:fresh',
        'migrate:refresh',
        'migrate:reset',
    ];

    public function ensureCommandIsAllowed(?string $command): void
    {
        if (! $this->isBlockedCommand($command)) {
            return;
        }

        throw DestructiveDatabaseCommandBlockedException::forCommand($command);
    }

    public function isBlockedCommand(?string $command): bool
    {
        return in_array($command, self::BLOCKED_DATABASE_COMMANDS, true);
    }
}
