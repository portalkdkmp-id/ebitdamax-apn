---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/CustomerAnalysisController.php
generated: 2026-09-15
---

# CustomerAnalysisController

> [!info] Controller
> - File: `app/Http/Controllers/CustomerAnalysisController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/customer-analyses` | `customer-analyses.index` | `index` | `web`, `auth`, `verified` |
| `POST` | `/customer-analyses` | `customer-analyses.store` | `store` | `web`, `auth`, `verified` |
| `PUT|PATCH` | `/customer-analyses/{customer_analysis}` | `customer-analyses.update` | `update` | `web`, `auth`, `verified` |

## Model terkait

- [[CustomerAnalysis]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/CustomerAnalysis/Index`

