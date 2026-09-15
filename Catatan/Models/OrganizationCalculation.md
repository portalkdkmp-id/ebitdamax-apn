---
tags:
  - ebitdamax
  - model
type: model
table: organization_calculations
source: app/Models/OrganizationCalculation.php
generated: 2026-09-15
---

# OrganizationCalculation

> [!info] Model Eloquent
> - Tabel: `organization_calculations`
> - File: `app/Models/OrganizationCalculation.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `organization_id`
- `source_sheet`
- `classification`
- `man_cost`
- `method_cost`
- `material_cost`
- `machine_cost`
- `total_cost`
- `doc_variable`
- `doc_fixed`
- `ioc`
- `raw_payload`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `man_cost` | `decimal:2` |
| `method_cost` | `decimal:2` |
| `material_cost` | `decimal:2` |
| `machine_cost` | `decimal:2` |
| `total_cost` | `decimal:2` |
| `doc_variable` | `decimal:2` |
| `doc_fixed` | `decimal:2` |
| `ioc` | `decimal:2` |
| `raw_payload` | `array` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `organization()` | BelongsTo | [[Organization]] |

