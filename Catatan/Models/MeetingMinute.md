---
tags:
  - ebitdamax
  - model
type: model
table: meeting_minutes
source: app/Models/MeetingMinute.php
generated: 2026-09-15
---

# MeetingMinute

> [!info] Model Eloquent
> - Tabel: `meeting_minutes`
> - File: `app/Models/MeetingMinute.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `title`
- `meeting_date`
- `start_time`
- `end_time`
- `location`
- `attendees`
- `created_by`
- `updated_by`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `meeting_date` | `date` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `items()` | HasMany | [[MeetingMinuteItem]] |
| `attachments()` | HasMany | [[MeetingMinuteAttachment]] |
| `creator()` | BelongsTo | [[User]] |
| `updater()` | BelongsTo | [[User]] |

## Digunakan oleh

- [[MeetingMinuteController]]

