---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/TaskReportController.php
generated: 2026-09-15
---

# TaskReportController

> [!info] Controller
> - File: `app/Http/Controllers/TaskReportController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `POST` | `/tasks/{task}/start` | `tasks.start` | `start` | `web`, `auth`, `verified`, `role.level:staff,manager,superadmin` |
| `POST` | `/tasks/{task}/finish` | `tasks.finish` | `finish` | `web`, `auth`, `verified`, `role.level:staff,manager,superadmin` |

## Model terkait

- [[EbitdamaxKdkmp]]
- [[Task]]
- [[TaskAdditionalField]]
- [[TaskReport]]
- [[TaskReportValue]]
- [[User]]

