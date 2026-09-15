---
tags:
  - ebitdamax
  - model
type: model
table: business_processes
source: app/Models/BusinessProcess.php
generated: 2026-09-15
---

# BusinessProcess

> [!info] Model Eloquent
> - Tabel: `business_processes`
> - File: `app/Models/BusinessProcess.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `user_id`
- `code`
- `name`
- `unit_name`
- `unit_code`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `user()` | BelongsTo | [[User]] |
| `steps()` | HasMany | [[BusinessProcessStep]] |

## Digunakan oleh

- [[BusinessProcessController]]
- [[PlanEbitdaMatrixController]]

