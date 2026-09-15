---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/DashboardController.php
generated: 2026-09-15
---

# DashboardController

> [!info] Controller
> - File: `app/Http/Controllers/DashboardController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/admin-dashboard` | `admin.dashboard` | `index` | `web`, `auth`, `verified`, `ebitdamax.domain:apn` |
| `GET` | `/dashboard/directorates/{organization}` | `dashboard.directorates.show` | `showDirectorate` | `web`, `auth`, `verified`, `ebitdamax.domain:apn` |

## Model terkait

- [[EbitdaValue]]
- [[Organization]]

## Halaman Inertia

- `resources/js/pages/Dashboard/Index`
- `resources/js/pages/Dashboard/Directorate`

