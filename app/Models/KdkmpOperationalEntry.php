<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KdkmpOperationalEntry extends Model
{
    protected $fillable = [
        'nik',
        'nama_kdkmp',
        'provinsi',
        'kota_kabupaten',
        'kecamatan',
        'has_po',
        'has_receipt',
        'has_sales',
        'po_raw',
        'receipt_raw',
        'sales_raw',
        'source_file',
        'imported_at',
        'raw_payload',
    ];

    protected $casts = [
        'has_po' => 'boolean',
        'has_receipt' => 'boolean',
        'has_sales' => 'boolean',
        'imported_at' => 'datetime',
        'raw_payload' => 'array',
    ];
}
