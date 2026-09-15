---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/OrganizationController.php
generated: 2026-09-15
---

# OrganizationController

> [!info] Controller
> - File: `app/Http/Controllers/OrganizationController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/organizations` | `organizations.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/organizations` | `organizations.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `PUT|PATCH` | `/organizations/{organization}` | `organizations.update` | `update` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `DELETE` | `/organizations/{organization}` | `organizations.destroy` | `destroy` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[Organization]]

## Halaman Inertia

- `resources/js/pages/Organizations/Index`

