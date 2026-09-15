---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/NotificationController.php
generated: 2026-09-15
---

# NotificationController

> [!info] Controller
> - File: `app/Http/Controllers/NotificationController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/notifications` | `notifications.index` | `index` | `web`, `auth`, `verified` |
| `PATCH` | `/notifications/read-all` | `notifications.read-all` | `markAllAsRead` | `web`, `auth`, `verified` |
| `PATCH` | `/notifications/{notification}/read` | `notifications.read` | `markAsRead` | `web`, `auth`, `verified` |

## Halaman Inertia

- `resources/js/pages/Notifications/Index`

