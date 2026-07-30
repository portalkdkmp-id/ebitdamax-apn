<?php

use App\Models\RevenuePlanRow;

$rows = [
    [
        'sort_order' => 1,
        'row_type' => RevenuePlanRow::TYPE_ITEM,
        'display_number' => null,
        'revenue_service' => 'REVENUE GERAI',
        'planned_volume' => 1,
        'unit' => '1 Hari',
        'rate' => 20000000,
        'planned_revenue' => 20000000,
    ],
];

foreach (range(1, 11) as $placeholderNumber) {
    $rows[] = [
        'sort_order' => $placeholderNumber + 1,
        'row_type' => RevenuePlanRow::TYPE_BLANK,
        'display_number' => $placeholderNumber <= 6 ? $placeholderNumber : null,
        'revenue_service' => null,
        'planned_volume' => null,
        'unit' => null,
        'rate' => null,
        'planned_revenue' => null,
    ];
}

return $rows;
