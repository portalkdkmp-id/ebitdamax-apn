---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/MeetingActionItemController.php
generated: 2026-09-15
---

# MeetingActionItemController

> [!info] Controller
> - File: `app/Http/Controllers/MeetingActionItemController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/meeting-minutes/action-items` | `meeting-minutes.action-items.index` | `index` | `web`, `auth`, `verified`, `role.level:manager,superadmin` |
| `PATCH` | `/meeting-minutes/action-items/{meetingMinuteItem}` | `meeting-minutes.action-items.update` | `update` | `web`, `auth`, `verified`, `role.level:manager,superadmin` |

## Model terkait

- [[MeetingMinuteItem]]
- [[MeetingMinuteItemStatusHistory]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/MeetingMinutes/ActionItems`

