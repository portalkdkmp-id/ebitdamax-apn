---
tags:
  - ebitdamax
  - model
type: model
table: revenue_plan_rows
source: app/Models/RevenuePlanRow.php
generated: 2026-09-15
---

# RevenuePlanRow

> [!info] Model Eloquent
> - Tabel: `revenue_plan_rows`
> - File: `app/Models/RevenuePlanRow.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `revenue_plan_id`
- `sort_order`
- `row_type`
- `display_number`
- `revenue_service`
- `planned_volume`
- `unit`
- `rate`
- `planned_revenue`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `sort_order` | `integer` |
| `display_number` | `integer` |
| `planned_volume` | `decimal:3` |
| `rate` | `decimal:2` |
| `planned_revenue` | `decimal:2` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `revenuePlan()` | BelongsTo | [[RevenuePlan]] |

## Digunakan oleh

- [[RevenuePlanController]]

