---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/UserController.php
generated: 2026-09-15
---

# UserController

> [!info] Controller
> - File: `app/Http/Controllers/UserController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/users` | `users.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/users` | `users.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `PUT|PATCH` | `/users/{user}` | `users.update` | `update` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `DELETE` | `/users/{user}` | `users.destroy` | `destroy` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[Role]]
- [[SdmKdkmpEntry]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/Users/Index`

