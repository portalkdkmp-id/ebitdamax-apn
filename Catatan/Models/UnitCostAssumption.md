---
tags:
  - ebitdamax
  - model
type: model
table: unit_cost_assumptions
source: app/Models/UnitCostAssumption.php
generated: 2026-09-15
---

# UnitCostAssumption

> [!info] Model Eloquent
> - Tabel: `unit_cost_assumptions`
> - File: `app/Models/UnitCostAssumption.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `user_id`
- `code`
- `name`
- `assumption_date`
- `days_per_year`
- `days_per_month`
- `work_hours_per_day`
- `source_sheet`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `assumption_date` | `date` |
| `days_per_year` | `integer` |
| `days_per_month` | `integer` |
| `work_hours_per_day` | `decimal:2` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `user()` | BelongsTo | [[User]] |
| `rows()` | HasMany | [[UnitCostAssumptionRow]] |

## Digunakan oleh

- [[PlanEbitdaMatrixController]]
- [[UnitCostAssumptionController]]

