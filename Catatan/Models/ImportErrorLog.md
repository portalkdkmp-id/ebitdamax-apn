---
tags:
  - ebitdamax
  - model
type: model
table: import_error_logs
source: app/Models/ImportErrorLog.php
generated: 2026-09-15
---

# ImportErrorLog

> [!info] Model Eloquent
> - Tabel: `import_error_logs`
> - File: `app/Models/ImportErrorLog.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `excel_import_id`
- `row_number`
- `sheet_name`
- `message`
- `payload`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `payload` | `array` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `excelImport()` | BelongsTo | [[ExcelImport]] |

## Digunakan oleh

- [[ExcelImportController]]

