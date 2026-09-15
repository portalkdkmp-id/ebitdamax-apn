---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/TaskController.php
generated: 2026-09-15
---

# TaskController

> [!info] Controller
> - File: `app/Http/Controllers/TaskController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/tasks` | `tasks.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/tasks` | `tasks.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `PUT|PATCH` | `/tasks/{task}` | `tasks.update` | `update` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `DELETE` | `/tasks/{task}` | `tasks.destroy` | `destroy` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[Role]]
- [[Task]]
- [[TaskAdditionalField]]
- [[TaskCategory]]

## Halaman Inertia

- `resources/js/pages/Tasks/Index`

