---
tags:
  - ebitdamax
  - model
type: model
table: meeting_minute_item_status_histories
source: app/Models/MeetingMinuteItemStatusHistory.php
generated: 2026-09-15
---

# MeetingMinuteItemStatusHistory

> [!info] Model Eloquent
> - Tabel: `meeting_minute_item_status_histories`
> - File: `app/Models/MeetingMinuteItemStatusHistory.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `meeting_minute_item_id`
- `from_status`
- `to_status`
- `note`
- `changed_by`
- `changed_by_name`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `created_at` | `datetime` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `meetingMinuteItem()` | BelongsTo | [[MeetingMinuteItem]] |
| `changedBy()` | BelongsTo | [[User]] |

## Digunakan oleh

- [[MeetingActionItemController]]

