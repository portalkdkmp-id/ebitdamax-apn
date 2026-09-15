---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/MonitoringDashboardController.php
generated: 2026-09-15
---

# MonitoringDashboardController

> [!info] Controller
> - File: `app/Http/Controllers/MonitoringDashboardController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/monitoring` | `monitoring.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `GET` | `/monitoring/map-points` | `monitoring.map-points` | `mapPointsMeta` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `GET` | `/monitoring/map-points-binary` | `monitoring.map-points-binary` | `mapPointsBinary` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Halaman Inertia

- `resources/js/pages/Monitoring/Index`

