---
tags:
  - ebitdamax
  - model
type: model
table: task_categories
source: app/Models/TaskCategory.php
generated: 2026-09-15
---

# TaskCategory

> [!info] Model Eloquent
> - Tabel: `task_categories`
> - File: `app/Models/TaskCategory.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `uuid`
- `name`
- `slug`
- `description`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `tasks()` | HasMany | [[Task]] |

## Scope

- `ordered`

## Digunakan oleh

- [[TaskCategoryController]]
- [[TaskController]]

