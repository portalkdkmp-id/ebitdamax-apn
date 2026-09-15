---
tags:
  - ebitdamax
  - model
type: model
table: task_additional_fields
source: app/Models/TaskAdditionalField.php
generated: 2026-09-15
---

# TaskAdditionalField

> [!info] Model Eloquent
> - Tabel: `task_additional_fields`
> - File: `app/Models/TaskAdditionalField.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `uuid`
- `task_id`
- `label`
- `field_name`
- `input_type`
- `show_when`
- `is_required`
- `sort_order`
- `options`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `input_type` | `TaskAdditionalFieldInputType (enum)` |
| `show_when` | `TaskAdditionalFieldShowWhen (enum)` |
| `is_required` | `boolean` |
| `sort_order` | `integer` |
| `options` | `array` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `task()` | BelongsTo | [[Task]] |

## Digunakan oleh

- [[TaskController]]
- [[TaskDashboardController]]
- [[TaskReportController]]

