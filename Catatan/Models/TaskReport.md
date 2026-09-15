---
tags:
  - ebitdamax
  - model
type: model
table: task_reports
source: app/Models/TaskReport.php
generated: 2026-09-15
---

# TaskReport

> [!info] Model Eloquent
> - Tabel: `task_reports`
> - File: `app/Models/TaskReport.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `uuid`
- `task_id`
- `user_id`
- `period_key`
- `started_photo`
- `started_documents`
- `finished_photo`
- `finished_documents`
- `started_at`
- `finished_at`
- `duration_minutes`
- `member_allocations`
- `manager_self_assigned`
- `status`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `started_at` | `datetime` |
| `started_documents` | `array` |
| `finished_at` | `datetime` |
| `finished_documents` | `array` |
| `duration_minutes` | `integer` |
| `member_allocations` | `array` |
| `manager_self_assigned` | `boolean` |
| `status` | `TaskReportStatus (enum)` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `task()` | BelongsTo | [[Task]] |
| `user()` | BelongsTo | [[User]] |
| `values()` | HasMany | [[TaskReportValue]] |

## Digunakan oleh

- [[KdkmpDashboardTaskController]]
- [[TaskDashboardController]]
- [[TaskReportController]]
- [[TaskReportDocumentController]]

