---
tags:
  - ebitdamax
  - model
type: model
table: koperasi_sarpras_status_points
source: app/Models/KoperasiSarprasStatusPoint.php
generated: 2026-09-15
---

# KoperasiSarprasStatusPoint

> [!info] Model Eloquent
> - Tabel: `koperasi_sarpras_status_points`
> - File: `app/Models/KoperasiSarprasStatusPoint.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `nik`
- `nama_koperasi`
- `provinsi`
- `kota_kabupaten`
- `kecamatan`
- `desa`
- `kodim`
- `lat`
- `lng`
- `validation_status`
- `progress_percentage`
- `batch`
- `completed_sarpras_count`
- `sarpras_less_than_6`
- `sarpras_primary_lengkap`
- `sarpras_secondary_lengkap`
- `sarpras_lengkap`
- `has_po`
- `has_receipt`
- `has_sales`
- `synced_at`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `lat` | `float` |
| `lng` | `float` |
| `progress_percentage` | `float` |
| `completed_sarpras_count` | `integer` |
| `sarpras_less_than_6` | `boolean` |
| `sarpras_primary_lengkap` | `boolean` |
| `sarpras_secondary_lengkap` | `boolean` |
| `sarpras_lengkap` | `boolean` |
| `has_po` | `boolean` |
| `has_receipt` | `boolean` |
| `has_sales` | `boolean` |
| `synced_at` | `datetime` |

