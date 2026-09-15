---
tags:
  - ebitdamax
  - model
type: model
table: customer_analyses
source: app/Models/CustomerAnalysis.php
generated: 2026-09-15
---

# CustomerAnalysis

> [!info] Model Eloquent
> - Tabel: `customer_analyses`
> - File: `app/Models/CustomerAnalysis.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `user_id`
- `full_name`
- `occupation_role`
- `occupation_other`
- `age`
- `gender`
- `interview_purpose`
- `summary`
- `sentiment`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `age` | `integer` |
| `sentiment` | `integer` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `manager()` | BelongsTo | [[User]] |

## Digunakan oleh

- [[CustomerAnalysisController]]

