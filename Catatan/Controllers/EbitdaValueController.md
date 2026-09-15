---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/EbitdaValueController.php
generated: 2026-09-15
---

# EbitdaValueController

> [!info] Controller
> - File: `app/Http/Controllers/EbitdaValueController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/ebitda-values` | `ebitda-values.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/ebitda-values` | `ebitda-values.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `PUT|PATCH` | `/ebitda-values/{ebitda_value}` | `ebitda-values.update` | `update` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `DELETE` | `/ebitda-values/{ebitda_value}` | `ebitda-values.destroy` | `destroy` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[EbitdaValue]]
- [[Organization]]

## Halaman Inertia

- `resources/js/pages/EbitdaValues/Index`

