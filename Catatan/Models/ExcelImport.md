---
tags:
  - ebitdamax
  - model
type: model
table: excel_imports
source: app/Models/ExcelImport.php
generated: 2026-09-15
---

# ExcelImport

> [!info] Model Eloquent
> - Tabel: `excel_imports`
> - File: `app/Models/ExcelImport.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `filename`
- `original_filename`
- `status`
- `total_rows`
- `success_rows`
- `failed_rows`
- `created_by`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `errors()` | HasMany | [[ImportErrorLog]] |

## Digunakan oleh

- [[ExcelImportController]]

