---
tags:
  - ebitdamax
  - model
type: model
table: plan_ebitda_matrices
source: app/Models/PlanEbitdaMatrix.php
generated: 2026-09-15
---

# PlanEbitdaMatrix

> [!info] Model Eloquent
> - Tabel: `plan_ebitda_matrices`
> - File: `app/Models/PlanEbitdaMatrix.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `user_id`
- `business_process_id`
- `unit_cost_assumption_id`
- `revenue_plan_id`
- `code`
- `name`
- `source_sheet`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `user()` | BelongsTo | [[User]] |
| `businessProcess()` | BelongsTo | [[BusinessProcess]] |
| `unitCostAssumption()` | BelongsTo | [[UnitCostAssumption]] |
| `revenuePlan()` | BelongsTo | [[RevenuePlan]] |
| `processes()` | HasMany | [[PlanEbitdaMatrixProcess]] |
| `rows()` | HasMany | [[PlanEbitdaMatrixRow]] |

## Digunakan oleh

- [[PlanEbitdaMatrixController]]

