<?php

namespace App\Enums;

enum RoleLevel: string
{
    case Staff = 'staff';
    case Manager = 'manager';
    case Superadmin = 'superadmin';

    public function label(): string
    {
        return match ($this) {
            self::Staff => 'Staff',
            self::Manager => 'Manager',
            self::Superadmin => 'Super Admin',
        };
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $level): array => [
                'value' => $level->value,
                'label' => $level->label(),
            ],
            self::cases()
        );
    }
}
