---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/MeetingMinuteController.php
generated: 2026-09-15
---

# MeetingMinuteController

> [!info] Controller
> - File: `app/Http/Controllers/MeetingMinuteController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/meeting-minutes` | `meeting-minutes.index` | `index` | `web`, `auth`, `verified` |
| `POST` | `/meeting-minutes` | `meeting-minutes.store` | `store` | `web`, `auth`, `verified` |
| `PUT|PATCH` | `/meeting-minutes/{meeting_minute}` | `meeting-minutes.update` | `update` | `web`, `auth`, `verified` |
| `DELETE` | `/meeting-minutes/{meeting_minute}` | `meeting-minutes.destroy` | `destroy` | `web`, `auth`, `verified` |
| `GET` | `/meeting-minutes/{meetingMinute}/attachments/{attachment}/preview` | `meeting-minutes.attachments.preview` | `previewAttachment` | `web`, `auth`, `verified` |
| `GET` | `/meeting-minutes/{meetingMinute}/attachments/{attachment}/download` | `meeting-minutes.attachments.download` | `downloadAttachment` | `web`, `auth`, `verified` |

## Model terkait

- [[MeetingMinute]]
- [[MeetingMinuteAttachment]]
- [[MeetingMinuteItem]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/MeetingMinutes/Index`

