---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/RoleController.php
generated: 2026-09-15
---

# RoleController

> [!info] Controller
> - File: `app/Http/Controllers/RoleController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/roles` | `roles.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/roles` | `roles.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `PUT|PATCH` | `/roles/{role}` | `roles.update` | `update` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `DELETE` | `/roles/{role}` | `roles.destroy` | `destroy` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[Role]]

## Halaman Inertia

- `resources/js/pages/Roles/Index`

