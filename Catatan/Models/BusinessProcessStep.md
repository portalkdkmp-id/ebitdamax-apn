---
tags:
  - ebitdamax
  - model
type: model
table: business_process_steps
source: app/Models/BusinessProcessStep.php
generated: 2026-09-15
---

# BusinessProcessStep

> [!info] Model Eloquent
> - Tabel: `business_process_steps`
> - File: `app/Models/BusinessProcessStep.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `business_process_id`
- `sequence`
- `process_group`
- `detail_process`
- `pic`
- `standard_time_minutes`
- `output_target`
- `responsibility_value`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `sequence` | `integer` |
| `standard_time_minutes` | `integer` |
| `responsibility_value` | `integer` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `businessProcess()` | BelongsTo | [[BusinessProcess]] |

## Digunakan oleh

- [[BusinessProcessController]]
- [[PlanEbitdaMatrixController]]

