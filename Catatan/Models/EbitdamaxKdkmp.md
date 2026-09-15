---
tags:
  - ebitdamax
  - model
type: model
table: ebitdamax_kdkmp
source: app/Models/EbitdamaxKdkmp.php
generated: 2026-09-15
---

# EbitdamaxKdkmp

> [!info] Model Eloquent
> - Tabel: `ebitdamax_kdkmp`
> - File: `app/Models/EbitdamaxKdkmp.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `sdm_kdkmp_entry_id`
- `report_date`
- `target_revenue`
- `plan_revenue`
- `plan_revenue_requires_review`
- `actual_revenue`
- `target_cost`
- `plan_cost`
- `actual_cost`
- `actual_variable_cost`
- `target_ebitda`
- `plan_ebitda`
- `actual_ebitda`
- `target_ebitda_margin`
- `actual_ebitda_margin`
- `total_duration`
- `performance_scoring`
- `operational_attendance`
- `selected_task_ids`
- `operational_attendance_saved_at`
- `created_by`
- `updated_by`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `report_date` | `date` |
| `operational_attendance` | `array` |
| `selected_task_ids` | `array` |
| `operational_attendance_saved_at` | `datetime` |
| `plan_revenue_requires_review` | `boolean` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `sdmKdkmpEntry()` | BelongsTo | [[SdmKdkmpEntry]] |
| `creator()` | BelongsTo | [[User]] |
| `updater()` | BelongsTo | [[User]] |

## Digunakan oleh

- [[KdkmpDashboardController]]
- [[KdkmpDashboardMonitoringController]]
- [[KdkmpDashboardTaskController]]
- [[TaskDashboardController]]
- [[TaskReportController]]

