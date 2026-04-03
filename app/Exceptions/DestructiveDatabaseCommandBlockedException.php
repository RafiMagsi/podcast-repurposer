<?php

namespace App\Exceptions;

use RuntimeException;

class DestructiveDatabaseCommandBlockedException extends RuntimeException
{
    public static function forCommand(string $command): self
    {
        return new self(sprintf(
            'Blocked destructive database command [%s]. This project uses the shared local database and does not allow wipe/refresh/reset/fresh commands.',
            $command
        ));
    }
}
