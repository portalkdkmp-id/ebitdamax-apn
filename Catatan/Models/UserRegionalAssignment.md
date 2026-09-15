---
tags:
  - ebitdamax
  - model
type: model
table: user_regional_assignments
source: app/Models/UserRegionalAssignment.php
generated: 2026-09-15
---

# UserRegionalAssignment

> [!info] Model Eloquent
> - Tabel: `user_regional_assignments`
> - File: `app/Models/UserRegionalAssignment.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `scope_level`
- `provinsi`
- `kota_kabupaten`
- `kecamatan`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `scope_level` | `RegionalScopeLevel (enum)` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `user()` | BelongsTo | [[User]] |

