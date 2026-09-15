---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/TaskDashboardController.php
generated: 2026-09-15
---

# TaskDashboardController

> [!info] Controller
> - File: `app/Http/Controllers/TaskDashboardController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/dashboard/tasks` | `task-dashboard.index` | `index` | `web`, `auth`, `verified`, `role.level:staff,manager,superadmin` |
| `GET` | `/dashboard/tasks/completed` | `task-dashboard.completed` | `completed` | `web`, `auth`, `verified`, `role.level:staff,manager,superadmin` |

## Model terkait

- [[EbitdamaxKdkmp]]
- [[Role]]
- [[Task]]
- [[TaskAdditionalField]]
- [[TaskReport]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/TaskDashboard/Index`
- `resources/js/pages/TaskDashboard/Completed`

