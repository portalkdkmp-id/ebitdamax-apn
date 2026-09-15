---
tags:
  - ebitdamax
  - model
type: model
table: meeting_minute_items
source: app/Models/MeetingMinuteItem.php
generated: 2026-09-15
---

# MeetingMinuteItem

> [!info] Model Eloquent
> - Tabel: `meeting_minute_items`
> - File: `app/Models/MeetingMinuteItem.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `meeting_minute_id`
- `subject`
- `description`
- `action`
- `objectives`
- `date_start`
- `date_finish`
- `pic`
- `status`
- `remarks`
- `sort_order`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `date_start` | `date` |
| `date_finish` | `date` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `meetingMinute()` | BelongsTo | [[MeetingMinute]] |
| `statusHistories()` | HasMany | [[MeetingMinuteItemStatusHistory]] |

## Digunakan oleh

- [[MeetingActionItemController]]
- [[MeetingMinuteController]]

