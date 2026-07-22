<?php

namespace App\Enums;

enum TaskAdditionalFieldShowWhen: string
{
    case Start = 'start';
    case Finish = 'finish';

    public function label(): string
    {
        return match ($this) {
            self::Start => 'Mulai Task',
            self::Finish => 'Selesaikan Task',
        };
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $showWhen): array => ['value' => $showWhen->value, 'label' => $showWhen->label()],
            self::cases()
        );
    }
}
