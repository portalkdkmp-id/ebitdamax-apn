<?php

namespace App\Enums;

enum RoleDomain: string
{
    case Apn = 'apn';
    case Kdkmp = 'kdkmp';

    public function label(): string
    {
        return match ($this) {
            self::Apn => 'EBITDAMAX APN',
            self::Kdkmp => 'EBITDAMAX KDKMP',
        };
    }
}
