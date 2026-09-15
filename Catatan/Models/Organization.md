---
tags:
  - ebitdamax
  - model
type: model
table: organizations
source: app/Models/Organization.php
generated: 2026-09-15
---

# Organization

> [!info] Model Eloquent
> - Tabel: `organizations`
> - File: `app/Models/Organization.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `parent_id`
- `code`
- `name`
- `slug`
- `depth`
- `path`
- `level`
- `node_type`
- `directorate_group`
- `is_revenue_center`
- `is_cost_center`
- `is_active`
- `sort_order`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `is_revenue_center` | `boolean` |
| `is_cost_center` | `boolean` |
| `is_active` | `boolean` |
| `depth` | `integer` |
| `sort_order` | `integer` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `parent()` | BelongsTo | [[Organization]] |
| `children()` | HasMany | [[Organization]] |
| `childrenRecursive()` | HasMany | [[Organization]] |
| `ebitdaValues()` | HasMany | [[EbitdaValue]] |
| `profile()` | HasOne | [[OrganizationProfile]] |
| `calculation()` | HasOne | [[OrganizationCalculation]] |

## Scope

- `root`
- `active`
- `ordered`
- `directorates`
- `dashboardUnits`

## Digunakan oleh

- [[DashboardController]]
- [[EbitdaTreeController]]
- [[EbitdaValueController]]
- [[OrganizationCalculationController]]
- [[OrganizationController]]
- [[ValueChainJobdeskController]]

