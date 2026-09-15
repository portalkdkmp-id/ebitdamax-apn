---
tags:
  - ebitdamax
  - model
type: model
table: roles
source: app/Models/Role.php
generated: 2026-09-15
---

# Role

> [!info] Model Eloquent
> - Tabel: `roles`
> - File: `app/Models/Role.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `uuid`
- `name`
- `slug`
- `level`
- `domain`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `level` | `RoleLevel (enum)` |
| `domain` | `RoleDomain (enum)` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `users()` | HasMany | [[User]] |
| `tasks()` | BelongsToMany | [[Task]] |

## Scope

- `ordered`

## Digunakan oleh

- [[AnnouncementController]]
- [[KdkmpDashboardTaskController]]
- [[RoleController]]
- [[TaskController]]
- [[TaskDashboardController]]
- [[UserController]]

