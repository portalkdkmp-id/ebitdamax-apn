---
tags:
  - ebitdamax
  - model
type: model
table: ebitda_values
source: app/Models/EbitdaValue.php
generated: 2026-09-15
---

# EbitdaValue

> [!info] Model Eloquent
> - Tabel: `ebitda_values`
> - File: `app/Models/EbitdaValue.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `excel_import_id`
- `organization_id`
- `period_date`
- `year`
- `scenario`
- `source_sheet`
- `revenue`
- `doc_variable`
- `doc_fixed`
- `ioc`
- `toc`
- `ebitda`
- `ebitda_margin`
- `raw_payload`
- `classification`
- `man_cost`
- `method_cost`
- `material_cost`
- `machine_cost`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `period_date` | `date` |
| `revenue` | `decimal:2` |
| `doc_variable` | `decimal:2` |
| `doc_fixed` | `decimal:2` |
| `ioc` | `decimal:2` |
| `toc` | `decimal:2` |
| `ebitda` | `decimal:2` |
| `ebitda_margin` | `decimal:4` |
| `raw_payload` | `array` |
| `man_cost` | `decimal:2` |
| `method_cost` | `decimal:2` |
| `material_cost` | `decimal:2` |
| `machine_cost` | `decimal:2` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `organization()` | BelongsTo | [[Organization]] |
| `excelImport()` | BelongsTo | [[ExcelImport]] |

## Digunakan oleh

- [[DashboardController]]
- [[EbitdaTreeController]]
- [[EbitdaValueController]]
- [[ExcelImportController]]
- [[OrganizationCalculationController]]

