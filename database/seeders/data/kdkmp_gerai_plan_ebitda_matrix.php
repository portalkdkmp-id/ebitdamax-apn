<?php

/** @return array<int, string|null> */
$sparse = function (array $values): array {
    $cells = array_fill(0, 17, null);

    foreach ($values as $process => $value) {
        $cells[$process - 1] = (string) $value;
    }

    return $cells;
};

/** @return array<int, string|null> */
$all = fn (string|int|float $value): array => array_fill(0, 17, (string) $value);

$rows = [];
$sortOrder = 0;

$add = function (
    string $sectionCode,
    string $label,
    array $values,
    string|int|float|null $total = null,
    string $rowType = 'detail',
    ?string $notes = null,
    ?string $notesTone = null,
    bool $isCalculated = false,
    int $sourcePage = 1,
) use (&$rows, &$sortOrder): void {
    $rows[] = [
        'section_code' => $sectionCode,
        'sort_order' => ++$sortOrder,
        'row_type' => $rowType,
        'label' => $label,
        'values' => $values,
        'total' => $total === null ? null : (string) $total,
        'notes' => $notes,
        'notes_tone' => $notesTone,
        'is_calculated' => $isCalculated,
        'source_page' => $sourcePage,
    ];
};

$empty = $sparse([]);
$processTimes = $sparse([1 => 45, 2 => 20, 3 => 25, 4 => 40, 5 => 15, 6 => 15, 7 => 20, 8 => 100, 9 => 50, 10 => 15, 11 => 15, 12 => 20, 13 => 25, 14 => 15, 15 => 15, 16 => 25, 17 => 20]);

$add('4.2', 'PIC/MAN/CREW/SDM PROSES (ORANG)', $empty, null, 'summary', 'Total SDM', 'yellow');
$add('4.2', 'Kepala Toko', $sparse([6 => 1, 11 => 1, 12 => 1, 17 => 1]), 1);
$add('4.2', 'Asisten Kepala Toko', $sparse([1 => 1, 11 => 1, 12 => 1, 13 => 1]), 1);
$add('4.2', 'Staf Gudang & Logistik', $sparse([6 => 2, 8 => 2, 9 => 2, 10 => 2, 14 => 1, 15 => 1, 16 => 2]), '1.714285714');
$add('4.2', 'Pramuniaga', $sparse([4 => 1, 5 => 1, 6 => 2, 7 => 2, 16 => 2]), '1.6');
$add('4.2', 'Kasir', $sparse([1 => 1, 2 => 1, 3 => 1, 13 => 1]), 1);

$add('4.3', 'STANDAR WAKTU PROCES (MENIT)', $processTimes, null, 'summary', 'Total Waktu (Menit)', 'yellow');
$add('4.3', 'Kepala Toko', $sparse([6 => 15, 11 => 15, 12 => 20, 17 => 20]), 70);
$add('4.3', 'Asisten Kepala Toko', $sparse([1 => 45, 11 => 15, 12 => 20, 13 => 25]), 105);
$add('4.3', 'Staf Gudang & Logistik', $sparse([6 => 15, 8 => 100, 9 => 50, 10 => 15, 14 => 15, 15 => 15, 16 => 25]), 235);
$add('4.3', 'Pramuniaga', $sparse([4 => 40, 5 => 20, 6 => 15, 7 => 20, 16 => 25]), 120);
$add('4.3', 'Kasir', $sparse([1 => 45, 2 => 20, 3 => 25, 7 => 20, 13 => 25]), 135);
$add('4.3', 'STANDAR WAKTU RATA-RATA PROSES', $sparse([1 => 45, 2 => 20, 3 => 25, 4 => 40, 5 => 20, 6 => 15, 7 => 20, 8 => 100, 9 => 50, 10 => 15, 11 => 15, 12 => 20, 13 => 25, 14 => 15, 15 => 15, 16 => 25, 17 => 20]), 485, 'summary', null, 'blue', true);

$add('4.4', 'JAM KERJA PERHARI (JAM)', $all(8), 8, 'single', null, 'yellow');

$add('4.5', 'Kepala Toko', $sparse([6 => 7, 11 => 7, 12 => 7, 17 => 7]), 7, 'detail', null, null, true);
$add('4.5', 'Asisten Kepala Toko', $sparse([1 => 5, 11 => 5, 12 => 5, 13 => 5]), 5, 'detail', null, null, true);
$add('4.5', 'Staf Gudang & Logistik', $sparse([6 => 4, 8 => 4, 9 => 4, 10 => 4, 14 => 2, 15 => 2, 16 => 4]), 4, 'detail', null, null, true);
$add('4.5', 'Pramuniaga', $sparse([4 => 4, 5 => 4, 6 => 8, 7 => 8, 16 => 8]), 6, 'detail', null, null, true);
$add('4.5', 'Kasir', $sparse([1 => 4, 2 => 4, 3 => 4, 7 => 0, 13 => 4]), 3, 'detail', null, null, true);
$add('4.5', 'KAPASITAS PEKERJAAN TERSELESAIKAN', $sparse([1 => 4, 2 => 4, 3 => 4, 4 => 4, 5 => 4, 6 => 4, 8 => 4, 9 => 4, 10 => 4, 11 => 5, 12 => 5, 13 => 4, 14 => 2, 15 => 2, 16 => 4, 17 => 7]), null, 'summary', null, 'blue', true);

$add('4.6', 'COST VARIABLE MAN PER-PROSES', $sparse([1 => 95610, 2 => 6770, 3 => 10577, 4 => 60926, 5 => 15231, 6 => 26571, 7 => 22001, 8 => 231678, 9 => 57920, 10 => 5213, 11 => 19606, 12 => 34854, 13 => 29509, 14 => 5213, 15 => 5213, 16 => 38279, 17 => 22738]), null, 'summary', 'COST SDM VARIABLE PER JAM', 'blue', true);
$add('4.6', 'Kepala Toko', $sparse([6 => 12790, 11 => 12790, 12 => 22738, 17 => 22738]), 238750, 'detail', null, null, true);
$add('4.6', 'Asisten Kepala Toko', $sparse([1 => 61339, 11 => 6815, 12 => 12116, 13 => 18932]), 190833, 'detail', null, null, true);
$add('4.6', 'Staf Gudang & Logistik', $sparse([6 => 5213, 8 => 231678, 9 => 57920, 10 => 5213, 14 => 5213, 15 => 5213, 16 => 14480]), 326667, 'detail', null, null, true);
$add('4.6', 'Pramuniaga', $sparse([4 => 60926, 5 => 15231, 6 => 8568, 7 => 15231, 16 => 23799]), 274167, 'detail', null, null, true);
$add('4.6', 'Kasir', $sparse([1 => 34271, 2 => 6770, 3 => 10577, 7 => 6770, 13 => 10577]), 137083, 'detail', null, null, true);

$add('4.7', 'COST FIXED MAN PER-PROSES', $sparse([1 => 6032, 2 => 1173, 3 => 1466, 4 => 5278, 5 => 2639, 6 => 7454, 7 => 3812, 8 => 6738, 9 => 3369, 10 => 1011, 11 => 5595, 12 => 7460, 13 => 3351, 14 => 1011, 15 => 1011, 16 => 4983, 17 => 5952]), null, 'summary', 'COST SDM FIXED PER HARI', 'blue', true);
$add('4.7', 'Kepala Toko', $sparse([6 => 4464, 11 => 4464, 12 => 5952, 17 => 5952]), 20833, 'detail', null, null, true);
$add('4.7', 'Asisten Kepala Toko', $sparse([1 => 3393, 11 => 1131, 12 => 1508, 13 => 1885]), 7917, 'detail', null, null, true);
$add('4.7', 'Staf Gudang & Logistik', $sparse([6 => 1011, 8 => 6738, 9 => 3369, 10 => 1011, 14 => 1011, 15 => 1011, 16 => 1684]), 15833, 'detail', null, null, true);
$add('4.7', 'Pramuniaga', $sparse([4 => 5278, 5 => 2639, 6 => 1979, 7 => 2639, 16 => 3299]), 15833, 'detail', null, null, true);
$add('4.7', 'Kasir', $sparse([1 => 2639, 2 => 1173, 3 => 1466, 7 => 1173, 13 => 1466]), 7917, 'detail', null, null, true);

$machineSections = [
    ['4.8', 'PENGGUNAAN MACHINE PADA BISNIS PROSES', 6, 'DAFTAR MESIN / COST MACHINE VARIABLE PER JAM', 'yellow', false],
    ['4.9', 'PENGGUNAAN MACHINE (MENIT)', 6, 'Total Waktu (Menit)', 'yellow', false],
    ['4.10', 'COST MACHINE VARIABLE PER-PROSES', 8, null, 'blue', true],
    ['4.11', 'COST MACHINE FIXED PER-PROSES', 1, 'COST MACHINE FIXED PER JAM', 'blue', true],
];

foreach ($machineSections as [$section, $label, $detailCount, $notes, $tone, $calculated]) {
    $add($section, $label, $empty, null, 'summary', $notes, $tone, $calculated);

    foreach (range(1, $detailCount) as $number) {
        $add($section, '', $empty, $section === '4.9' ? 0 : null, 'detail', null, null, $calculated);
    }
}

$materials = [
    ['Kertas Struk Kasir Thermal (Ukuran 58mm/80mm)', 833],
    ['Kertas Label Harga (Price Tag Insert)', 167],
    ['Plastik Sampah Besar (Trash Bag)', 417],
    ['BBM KDKMP', 8333],
    ['Bahan Kimia Pembersih Toko (Sabun lantai, pembersih kaca, karbol)', 417],
    ['Harga Pokok Penjualan (HPP / COGS)', 58333],
    ['Stempel (1 unit)', 500],
    ['Listrik Token', 12500],
    ['Air (PDAM)', 2083],
    ['Internet (Paket)', 625],
    ['Pemeliharaan Gedung/Bangunan', 2083],
    ['Pemeliharaan Peralatan', 1250],
];

$materialUsage = [
    $sparse([9 => 1, 14 => 1]),
    $sparse([5 => 1]),
    $all(1),
    $sparse([13 => 1]),
    $sparse([16 => 1]),
    $sparse([9 => 1]),
    $sparse([1 => 1]),
    $all(1),
    $all(1),
    $all(1),
    $all(1),
    $all(1),
];

$materialMinutes = [
    $sparse([9 => 50, 14 => 15]),
    $sparse([5 => 15]),
    $processTimes,
    $sparse([13 => 25]),
    $sparse([16 => 25]),
    $sparse([9 => 50]),
    $sparse([1 => 45]),
    $processTimes,
    $processTimes,
    $processTimes,
    $processTimes,
    $processTimes,
];

$materialMinuteTotals = [65, 15, 480, 25, 25, 50, 45, 480, 480, 480, 480, 480];

$add('4.12', 'VARIABLE MATERIAL YANG DIGUNAKAN DALAM PROSES', $empty, null, 'summary', 'Bahan yang digunakan per proses', 'yellow', false, 2);

foreach ($materials as $index => [$label, $hourlyCost]) {
    $add('4.12', $label, $materialUsage[$index], $hourlyCost, 'detail', null, null, false, 2);
}

$add('4.13', 'WAKTU PENGGUNAAN MATERIAL DALAM PROSES (MENIT)', $empty, null, 'summary', 'Satuan: Menit', 'yellow', false, 2);

foreach ($materials as $index => [$label]) {
    $add('4.13', $label, $materialMinutes[$index], $materialMinuteTotals[$index], 'detail', null, null, false, 2);
}

$variableMaterialValues = $sparse([1 => 313, 2 => 139, 3 => 174, 4 => 278, 5 => 146, 6 => 104, 7 => 139, 8 => 694, 9 => 49653, 10 => 104, 11 => 104, 12 => 139, 13 => 3646, 14 => 313, 15 => 104, 16 => 347, 17 => 139]);
$add('4.14', 'COST MATERIAL VARIABLE PER-PROSES', $variableMaterialValues, null, 'summary', 'COST MATERIAL VARIABLE PER JAM', 'blue', true, 3);
$variableMaterialDetails = [
    $sparse([9 => 694, 14 => 208]),
    $sparse([5 => 42]),
    $sparse([1 => 313, 2 => 139, 3 => 174, 4 => 278, 5 => 104, 6 => 104, 7 => 139, 8 => 694, 9 => 347, 10 => 104, 11 => 104, 12 => 139, 13 => 174, 14 => 104, 15 => 104, 16 => 174, 17 => 139]),
    $sparse([13 => 3472]),
    $sparse([16 => 174]),
    $sparse([9 => 48611]),
];

foreach (array_slice($materials, 0, 6) as $index => [$label, $hourlyCost]) {
    $add('4.14', $label, $variableMaterialDetails[$index], $hourlyCost, 'detail', null, null, true, 3);
}

foreach (range(1, 4) as $number) {
    $add('4.14', '', $empty, null, 'detail', null, null, true, 3);
}

$fixedMaterial = $sparse([1 => 14134, 2 => 6282, 3 => 7852, 4 => 12564, 5 => 6282, 6 => 4711, 7 => 6282, 8 => 31409, 9 => 15704, 10 => 4711, 11 => 4711, 12 => 6282, 13 => 7852, 14 => 4711, 15 => 4711, 16 => 7852, 17 => 6282]);
$add('4.15', 'COST MATERIAL FIXED PER-PROSES', $fixedMaterial, null, 'summary', 'COST MATERIAL FIXED PER HARI', 'blue', true, 3);
$add('4.15', '', $fixedMaterial, 152333, 'detail', null, null, true, 3);

$variableSystem = $sparse([1 => 3247, 2 => 1443, 3 => 1804, 4 => 2887, 5 => 1443, 6 => 1082, 7 => 1443, 8 => 7216, 9 => 3608, 10 => 1082, 11 => 1082, 12 => 1443, 13 => 1804, 14 => 1082, 15 => 1082, 16 => 1804, 17 => 1443]);
$add('4.16', 'COST SYSTEM VARIABLE PER-PROSES', $variableSystem, null, 'summary', 'COST SYSTEM VARIABLE PER JAM', 'blue', true, 3);
$add('4.16', '', $variableSystem, 4375, 'detail', null, null, true, 3);

$add('4.17', 'COST SYSTEM FIXED PER-PROSES', $empty, null, 'summary', 'COST SYSTEM FIXED PER HARI', 'blue', true, 3);
$add('4.17', '', $empty, null, 'detail', null, null, true, 3);
$add('4.18', 'INDIRECT COST PER-PROSES', $empty, null, 'summary', 'INDIRECT COST PER HARI', 'blue', true, 3);
$add('4.18', '', $empty, null, 'detail', null, null, true, 3);

$summaryRows = [
    ['TOTAL VARIABLE MAN PER-HARI', [95610, 6770, 10577, 60926, 15231, 26571, 22001, 231678, 57920, 5213, 19606, 34854, 29509, 5213, 5213, 38279, 22738], 687909],
    ['TOTAL VARIABLE MACHINE', array_fill(0, 17, null), null],
    ['TOTAL VARIABLE MATERIAL', [313, 139, 174, 278, 146, 104, 139, 694, 49653, 104, 104, 139, 3646, 313, 104, 347, 139], 56535],
    ['TOTAL VARIABLE SYSTEM', [3247, 1443, 1804, 2887, 1443, 1082, 1443, 7216, 3608, 1082, 1082, 1443, 1804, 1082, 1082, 1804, 1443], 35000],
    ['TOTAL FIXED MAN', [6032, 1173, 1466, 5278, 2639, 7454, 3812, 6738, 3369, 1011, 5595, 7460, 3351, 1011, 1011, 4983, 5952], 68333],
    ['TOTAL FIXED MACHINE', array_fill(0, 17, null), null],
    ['TOTAL FIXED MATERIAL', [14134, 6282, 7852, 12564, 6282, 4711, 6282, 31409, 15704, 4711, 4711, 6282, 7852, 4711, 4711, 7852, 6282], 152333],
    ['TOTAL FIXED SYSTEM', array_fill(0, 17, null), null],
    ['DOC VARIABLE', [99170, 8352, 12555, 64090, 16821, 27757, 23583, 239589, 111181, 6399, 20792, 36437, 34959, 6608, 6399, 40430, 24320], 779444],
    ['DOC FIXED', [20166, 7455, 9318, 17841, 8921, 12165, 10094, 38147, 19073, 5722, 10307, 13742, 11203, 5722, 5722, 12835, 12234], 220667],
    ['IOC', array_fill(0, 17, null), null],
    ['TOTAL COST PROSES PER-HARI', [119336, 15806, 21873, 81932, 25741, 39923, 33677, 277736, 130254, 12121, 31099, 50179, 46162, 12330, 12121, 53266, 36554], 1000111],
    ['KUMULATIF COST', [119336, 135142, 157016, 238947, 264689, 304611, 338288, 616024, 746278, 758399, 789498, 839677, 885839, 898169, 910290, 939105, 975660], '#REF!'],
    ['TOTAL RENCANA PENDAPATAN PER-HARI', array_fill(0, 17, null), 20000000],
    ['RENCANA EBITDA', array_fill(0, 17, null), 18999889],
    ['EBITDA MARGIN', array_fill(0, 17, null), '95%'],
];

foreach ($summaryRows as [$label, $values, $total]) {
    $add(
        '4.19',
        $label,
        array_map(fn (int|float|string|null $value): ?string => $value === null ? null : (string) $value, $values),
        $total,
        'summary',
        null,
        'blue',
        true,
        4,
    );
}

return [
    'rows' => $rows,
];
