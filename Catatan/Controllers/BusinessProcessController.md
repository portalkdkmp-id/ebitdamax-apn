---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/BusinessProcessController.php
generated: 2026-09-15
---

# BusinessProcessController

> [!info] Controller
> - File: `app/Http/Controllers/BusinessProcessController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/business-processes/kdkmp-gerai` | `business-processes.kdkmp-gerai.index` | `kdkmpGerai` | `web`, `auth`, `verified` |
| `POST` | `/business-processes/kdkmp-gerai` | `business-processes.kdkmp-gerai.store` | `store` | `web`, `auth`, `verified` |
| `PUT` | `/business-processes/kdkmp-gerai/{businessProcess}` | `business-processes.kdkmp-gerai.update` | `update` | `web`, `auth`, `verified` |

## Model terkait

- [[BusinessProcess]]
- [[BusinessProcessStep]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/BusinessProcesses/KdkmpGerai`

