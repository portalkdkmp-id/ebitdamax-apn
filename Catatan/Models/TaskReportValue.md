---
tags:
  - ebitdamax
  - model
type: model
table: task_report_values
source: app/Models/TaskReportValue.php
generated: 2026-09-15
---

# TaskReportValue

> [!info] Model Eloquent
> - Tabel: `task_report_values`
> - File: `app/Models/TaskReportValue.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `uuid`
- `task_report_id`
- `task_additional_field_id`
- `value`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `report()` | BelongsTo | [[TaskReport]] |
| `additionalField()` | BelongsTo | [[TaskAdditionalField]] |

## Digunakan oleh

- [[KdkmpDashboardTaskController]]
- [[TaskReportController]]
- [[TaskReportDocumentController]]

