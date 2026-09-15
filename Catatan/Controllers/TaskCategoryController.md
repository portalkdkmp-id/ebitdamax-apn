---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/TaskCategoryController.php
generated: 2026-09-15
---

# TaskCategoryController

> [!info] Controller
> - File: `app/Http/Controllers/TaskCategoryController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/task-categories` | `task-categories.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/task-categories` | `task-categories.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `PUT|PATCH` | `/task-categories/{task_category}` | `task-categories.update` | `update` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `DELETE` | `/task-categories/{task_category}` | `task-categories.destroy` | `destroy` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[TaskCategory]]

## Halaman Inertia

- `resources/js/pages/TaskCategories/Index`

