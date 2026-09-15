---
tags:
  - ebitdamax
  - model
type: model
table: plan_ebitda_matrix_rows
source: app/Models/PlanEbitdaMatrixRow.php
generated: 2026-09-15
---

# PlanEbitdaMatrixRow

> [!info] Model Eloquent
> - Tabel: `plan_ebitda_matrix_rows`
> - File: `app/Models/PlanEbitdaMatrixRow.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `plan_ebitda_matrix_id`
- `unit_cost_assumption_row_id`
- `section_code`
- `sort_order`
- `row_type`
- `label`
- `values`
- `total`
- `notes`
- `notes_tone`
- `is_calculated`
- `source_page`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `sort_order` | `integer` |
| `values` | `array` |
| `is_calculated` | `boolean` |
| `source_page` | `integer` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `planEbitdaMatrix()` | BelongsTo | [[PlanEbitdaMatrix]] |
| `unitCostAssumptionRow()` | BelongsTo | [[UnitCostAssumptionRow]] |

## Digunakan oleh

- [[PlanEbitdaMatrixController]]

