---
tags:
  - ebitdamax
  - model
type: model
table: revenue_plans
source: app/Models/RevenuePlan.php
generated: 2026-09-15
---

# RevenuePlan

> [!info] Model Eloquent
> - Tabel: `revenue_plans`
> - File: `app/Models/RevenuePlan.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `user_id`
- `code`
- `name`
- `plan_date`
- `rka_revenue_target`
- `planned_production_quantity`
- `days_per_month`
- `daily_rka_revenue_target`
- `planned_total_daily_revenue`
- `source_sheet`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `plan_date` | `date` |
| `rka_revenue_target` | `decimal:2` |
| `planned_production_quantity` | `decimal:3` |
| `days_per_month` | `integer` |
| `daily_rka_revenue_target` | `decimal:2` |
| `planned_total_daily_revenue` | `decimal:2` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `user()` | BelongsTo | [[User]] |
| `rows()` | HasMany | [[RevenuePlanRow]] |

## Digunakan oleh

- [[PlanEbitdaMatrixController]]
- [[RevenuePlanController]]

