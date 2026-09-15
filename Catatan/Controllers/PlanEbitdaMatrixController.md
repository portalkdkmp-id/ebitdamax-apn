---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/PlanEbitdaMatrixController.php
generated: 2026-09-15
---

# PlanEbitdaMatrixController

> [!info] Controller
> - File: `app/Http/Controllers/PlanEbitdaMatrixController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/plan-ebitda-matrices/kdkmp-gerai` | `plan-ebitda-matrices.kdkmp-gerai.index` | `kdkmpGerai` | `web`, `auth`, `verified` |
| `POST` | `/plan-ebitda-matrices/kdkmp-gerai` | `plan-ebitda-matrices.kdkmp-gerai.store` | `store` | `web`, `auth`, `verified` |
| `PUT` | `/plan-ebitda-matrices/kdkmp-gerai/{planEbitdaMatrix}` | `plan-ebitda-matrices.kdkmp-gerai.update` | `update` | `web`, `auth`, `verified` |

## Model terkait

- [[BusinessProcess]]
- [[BusinessProcessStep]]
- [[PlanEbitdaMatrix]]
- [[PlanEbitdaMatrixProcess]]
- [[PlanEbitdaMatrixRow]]
- [[RevenuePlan]]
- [[UnitCostAssumption]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/PlanEbitdaMatrices/KdkmpGerai`

