<?php

namespace App\Enums;

enum TaskType: string
{
    case Regular = 'regular';
    case KegiatanStrategisPilihan = 'kegiatan_strategis_pilihan';

    public function label(): string
    {
        return match ($this) {
            self::Regular => 'Task Reguler',
            self::KegiatanStrategisPilihan => 'Kegiatan Strategis Pilihan',
        };
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ],
            self::cases(),
        );
    }
}
