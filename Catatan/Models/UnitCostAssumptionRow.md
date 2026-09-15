---
tags:
  - ebitdamax
  - model
type: model
table: unit_cost_assumption_rows
source: app/Models/UnitCostAssumptionRow.php
generated: 2026-09-15
---

# UnitCostAssumptionRow

> [!info] Model Eloquent
> - Tabel: `unit_cost_assumption_rows`
> - File: `app/Models/UnitCostAssumptionRow.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `unit_cost_assumption_id`
- `sort_order`
- `source_page`
- `row_type`
- `section_code`
- `category`
- `cost_type`
- `component`
- `plan_quantity`
- `actual_quantity`
- `description`
- `unit`
- `base_price`
- `plan_daily_cost`
- `plan_hourly_cost`
- `actual_daily_cost`
- `actual_hourly_cost`
- `plan_value`
- `actual_value`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `sort_order` | `integer` |
| `source_page` | `integer` |
| `plan_quantity` | `decimal:3` |
| `actual_quantity` | `decimal:3` |
| `base_price` | `decimal:2` |
| `plan_daily_cost` | `decimal:2` |
| `plan_hourly_cost` | `decimal:2` |
| `actual_daily_cost` | `decimal:2` |
| `actual_hourly_cost` | `decimal:2` |
| `plan_value` | `decimal:2` |
| `actual_value` | `decimal:2` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `assumption()` | BelongsTo | [[UnitCostAssumption]] |

## Digunakan oleh

- [[UnitCostAssumptionController]]

