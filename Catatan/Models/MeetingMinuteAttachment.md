---
tags:
  - ebitdamax
  - model
type: model
table: meeting_minute_attachments
source: app/Models/MeetingMinuteAttachment.php
generated: 2026-09-15
---

# MeetingMinuteAttachment

> [!info] Model Eloquent
> - Tabel: `meeting_minute_attachments`
> - File: `app/Models/MeetingMinuteAttachment.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `meeting_minute_id`
- `disk`
- `path`
- `original_name`
- `mime_type`
- `size`
- `uploaded_by`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `size` | `integer` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `meetingMinute()` | BelongsTo | [[MeetingMinute]] |
| `uploader()` | BelongsTo | [[User]] |

## Digunakan oleh

- [[MeetingMinuteController]]

