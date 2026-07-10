<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KoperasiSarprasStatusPoint extends Model
{
    protected $fillable = [
        'nik',
        'nama_koperasi',
        'provinsi',
        'kota_kabupaten',
        'kecamatan',
        'desa',
        'kodim',
        'lat',
        'lng',
        'validation_status',
        'progress_percentage',
        'batch',
        'completed_sarpras_count',
        'sarpras_less_than_6',
        'sarpras_primary_lengkap',
        'sarpras_secondary_lengkap',
        'sarpras_lengkap',
        'has_po',
        'has_receipt',
        'has_sales',
        'synced_at',
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'progress_percentage' => 'float',
        'completed_sarpras_count' => 'integer',
        'sarpras_less_than_6' => 'boolean',
        'sarpras_primary_lengkap' => 'boolean',
        'sarpras_secondary_lengkap' => 'boolean',
        'sarpras_lengkap' => 'boolean',
        'has_po' => 'boolean',
        'has_receipt' => 'boolean',
        'has_sales' => 'boolean',
        'synced_at' => 'datetime',
    ];
}
