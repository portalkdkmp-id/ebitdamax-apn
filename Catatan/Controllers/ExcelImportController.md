---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/ExcelImportController.php
generated: 2026-09-15
---

# ExcelImportController

> [!info] Controller
> - File: `app/Http/Controllers/ExcelImportController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/import-excel` | `import-excel.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/import-excel` | `import-excel.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[EbitdaValue]]
- [[ExcelImport]]
- [[ImportErrorLog]]

## Halaman Inertia

- `resources/js/pages/Import/Index`

