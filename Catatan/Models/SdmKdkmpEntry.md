---
tags:
  - ebitdamax
  - model
type: model
table: sdm_kdkmp_entries
source: app/Models/SdmKdkmpEntry.php
generated: 2026-09-15
---

# SdmKdkmpEntry

> [!info] Model Eloquent
> - Tabel: `sdm_kdkmp_entries`
> - File: `app/Models/SdmKdkmpEntry.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `nik`
- `nama_koperasi`
- `provinsi`
- `nama_kodam`
- `nama_korem`
- `nama_kodim`
- `desa`
- `kecamatan`
- `kota_kabupaten`
- `batch`
- `jumlah_karyawan`
- `catatan`
- `created_by`
- `updated_by`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `jumlah_karyawan` | `integer` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `creator()` | BelongsTo | [[User]] |
| `updater()` | BelongsTo | [[User]] |
| `managerUser()` | HasOne | [[User]] |
| `dailyEbitdaRecords()` | HasMany | [[EbitdamaxKdkmp]] |

## Scope

- `forRegions`
- `accessibleBy`

## Digunakan oleh

- [[KdkmpDashboardController]]
- [[KdkmpDashboardMonitoringController]]
- [[KdkmpDashboardTaskController]]
- [[SdmKdkmpEntryController]]
- [[UserController]]

