<?php

namespace App\Enums;

enum TaskBmcStatus: string
{
    case Unmapped = 'belum_dipetakan';
    case KeyPartnerships = 'key_partnerships';
    case KeyActivities = 'key_activities';
    case KeyResources = 'key_resources';
    case ValuePropositions = 'value_propositions';
    case CustomerRelationships = 'customer_relationships';
    case Channels = 'channels';
    case CustomerSegments = 'customer_segments';
    case CostStructure = 'cost_structure';
    case RevenueStreams = 'revenue_streams';

    public function label(): string
    {
        return match ($this) {
            self::Unmapped => 'Belum Dipetakan',
            self::KeyPartnerships => 'Key Partnerships',
            self::KeyActivities => 'Key Activities',
            self::KeyResources => 'Key Resources',
            self::ValuePropositions => 'Value Propositions',
            self::CustomerRelationships => 'Customer Relationships',
            self::Channels => 'Channels',
            self::CustomerSegments => 'Customer Segments',
            self::CostStructure => 'Cost Structure',
            self::RevenueStreams => 'Revenue Streams',
        };
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ],
            [
                self::Unmapped,
                self::KeyPartnerships,
                self::KeyActivities,
                self::KeyResources,
                self::ValuePropositions,
                self::CustomerRelationships,
                self::Channels,
                self::CustomerSegments,
                self::CostStructure,
                self::RevenueStreams,
            ],
        );
    }
}
