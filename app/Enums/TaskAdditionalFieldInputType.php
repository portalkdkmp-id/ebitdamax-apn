<?php

namespace App\Enums;

enum TaskAdditionalFieldInputType: string
{
    case Text = 'text';
    case Textarea = 'textarea';
    case Integer = 'integer';
    case Decimal = 'decimal';
    case Number = 'number';
    case Date = 'date';
    case Datetime = 'datetime';
    case Time = 'time';
    case Boolean = 'boolean';
    case Select = 'select';
    case Radio = 'radio';
    case Checkbox = 'checkbox';

    public function label(): string
    {
        return match ($this) {
            self::Text => 'Text',
            self::Textarea => 'Textarea',
            self::Integer => 'Integer',
            self::Decimal => 'Decimal',
            self::Number => 'Number',
            self::Date => 'Date',
            self::Datetime => 'Datetime',
            self::Time => 'Time',
            self::Boolean => 'Boolean',
            self::Select => 'Select',
            self::Radio => 'Radio',
            self::Checkbox => 'Checkbox',
        };
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $type): array => ['value' => $type->value, 'label' => $type->label()],
            self::cases()
        );
    }
}
