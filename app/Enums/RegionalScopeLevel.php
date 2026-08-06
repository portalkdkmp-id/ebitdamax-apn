<?php

namespace App\Enums;

enum RegionalScopeLevel: string
{
    case Province = 'province';
    case Regency = 'regency';
    case District = 'district';

    public function label(): string
    {
        return match ($this) {
            self::Province => 'Provinsi',
            self::Regency => 'Kabupaten/Kota',
            self::District => 'Kecamatan',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(
            fn (self $level): string => $level->value,
            self::cases(),
        );
    }
}
