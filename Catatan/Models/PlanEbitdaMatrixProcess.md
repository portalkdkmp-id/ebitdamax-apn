---
tags:
  - ebitdamax
  - model
type: model
table: plan_ebitda_matrix_processes
source: app/Models/PlanEbitdaMatrixProcess.php
generated: 2026-09-15
---

# PlanEbitdaMatrixProcess

> [!info] Model Eloquent
> - Tabel: `plan_ebitda_matrix_processes`
> - File: `app/Models/PlanEbitdaMatrixProcess.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `plan_ebitda_matrix_id`
- `business_process_step_id`
- `sequence`
- `process_group`
- `detail_process`
- `unit_name`
- `pic`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `sequence` | `integer` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `planEbitdaMatrix()` | BelongsTo | [[PlanEbitdaMatrix]] |
| `businessProcessStep()` | BelongsTo | [[BusinessProcessStep]] |

## Digunakan oleh

- [[PlanEbitdaMatrixController]]

