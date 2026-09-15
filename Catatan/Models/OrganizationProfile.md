---
tags:
  - ebitdamax
  - model
type: model
table: organization_profiles
source: app/Models/OrganizationProfile.php
generated: 2026-09-15
---

# OrganizationProfile

> [!info] Model Eloquent
> - Tabel: `organization_profiles`
> - File: `app/Models/OrganizationProfile.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `organization_id`
- `excel_import_id`
- `source_sheet`
- `job_description`
- `qualification`
- `value_chain`
- `method_cost`
- `raw_payload`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `method_cost` | `decimal:2` |
| `raw_payload` | `array` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `organization()` | BelongsTo | [[Organization]] |
| `excelImport()` | BelongsTo | [[ExcelImport]] |

## Digunakan oleh

- [[ValueChainJobdeskController]]

