---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/OrganizationCalculationController.php
generated: 2026-09-15
---

# OrganizationCalculationController

> [!info] Controller
> - File: `app/Http/Controllers/OrganizationCalculationController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/kalkulasi` | `calculations.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/kalkulasi` | `calculations.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `PUT` | `/kalkulasi/{calculation}` | `calculations.update` | `update` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `DELETE` | `/kalkulasi/{calculation}` | `calculations.destroy` | `destroy` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[EbitdaValue]]
- [[Organization]]

## Halaman Inertia

- `resources/js/pages/Calculations/Index`

