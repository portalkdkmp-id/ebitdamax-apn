---
tags:
  - ebitdamax
  - model
type: model
table: tasks
source: app/Models/Task.php
generated: 2026-09-15
---

# Task

> [!info] Model Eloquent
> - Tabel: `tasks`
> - File: `app/Models/Task.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `uuid`
- `task_category_id`
- `bmc_status`
- `sort_order`
- `name`
- `description`
- `execution_time`
- `time_require`
- `lower_time_threshold_minutes`
- `upper_time_threshold_minutes`
- `period`
- `is_active`
- `is_mandatory`
- `fixed_cost`
- `variable_cost`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `bmc_status` | `TaskBmcStatus (enum)` |
| `sort_order` | `integer` |
| `time_require` | `integer` |
| `lower_time_threshold_minutes` | `integer` |
| `upper_time_threshold_minutes` | `integer` |
| `period` | `TaskPeriod (enum)` |
| `is_active` | `boolean` |
| `is_mandatory` | `boolean` |
| `fixed_cost` | `array` |
| `variable_cost` | `array` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `taskCategory()` | BelongsTo | [[TaskCategory]] |
| `roles()` | BelongsToMany | [[Role]] |
| `additionalFields()` | HasMany | [[TaskAdditionalField]] |
| `reports()` | HasMany | [[TaskReport]] |

## Scope

- `active`
- `forKdkmpExecution`

## Digunakan oleh

- [[KdkmpDashboardController]]
- [[TaskController]]
- [[TaskDashboardController]]
- [[TaskReportController]]

