---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/AnnouncementController.php
generated: 2026-09-15
---

# AnnouncementController

> [!info] Controller
> - File: `app/Http/Controllers/AnnouncementController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/announcements` | `announcements.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/announcements` | `announcements.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[Role]]
- [[User]]

## Halaman Inertia

- `resources/js/pages/Announcements/Index`

