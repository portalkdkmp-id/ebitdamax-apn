---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/KdkmpDashboardController.php
generated: 2026-09-15
---

# KdkmpDashboardController

> [!info] Controller
> - File: `app/Http/Controllers/KdkmpDashboardController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/dashboard/kdkmp` | `kdkmp-dashboard.index` | `index` | `web`, `auth`, `verified` |
| `GET` | `/dashboard/kdkmp/input` | `kdkmp-dashboard.input` | `input` | `web`, `auth`, `verified` |
| `PUT` | `/dashboard/kdkmp/today` | `kdkmp-dashboard.upsert` | `upsert` | `web`, `auth`, `verified` |
| `PUT` | `/dashboard/kdkmp/today/task-selection` | `kdkmp-dashboard.task-selection.save` | `saveTaskSelection` | `web`, `auth`, `verified` |
| `PUT` | `/dashboard/kdkmp/today/operational-attendance` | `kdkmp-dashboard.operational-attendance.save` | `saveOperationalAttendance` | `web`, `auth`, `verified` |

## Model terkait

- [[EbitdamaxKdkmp]]
- [[SdmKdkmpEntry]]
- [[Task]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/KdkmpDashboard/Index`
- `resources/js/pages/KdkmpDashboard/Input`

