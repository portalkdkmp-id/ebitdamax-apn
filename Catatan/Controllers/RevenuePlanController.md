---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/RevenuePlanController.php
generated: 2026-09-15
---

# RevenuePlanController

> [!info] Controller
> - File: `app/Http/Controllers/RevenuePlanController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/revenue-plans/kdkmp-gerai` | `revenue-plans.kdkmp-gerai.index` | `kdkmpGerai` | `web`, `auth`, `verified` |
| `POST` | `/revenue-plans/kdkmp-gerai` | `revenue-plans.kdkmp-gerai.store` | `store` | `web`, `auth`, `verified` |
| `PUT` | `/revenue-plans/kdkmp-gerai/{revenuePlan}` | `revenue-plans.kdkmp-gerai.update` | `update` | `web`, `auth`, `verified` |

## Model terkait

- [[RevenuePlan]]
- [[RevenuePlanRow]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/RevenuePlans/KdkmpGerai`

