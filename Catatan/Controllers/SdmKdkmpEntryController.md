---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/SdmKdkmpEntryController.php
generated: 2026-09-15
---

# SdmKdkmpEntryController

> [!info] Controller
> - File: `app/Http/Controllers/SdmKdkmpEntryController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/sdm-data` | `sdm-data.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `PUT|PATCH` | `/sdm-data/{sdm_data}` | `sdm-data.update` | `update` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[SdmKdkmpEntry]]

## Halaman Inertia

- `resources/js/pages/SdmData/Index`

