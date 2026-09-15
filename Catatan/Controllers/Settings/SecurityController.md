---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/Settings/SecurityController.php
generated: 2026-09-15
---

# SecurityController

> [!info] Controller
> - File: `app/Http/Controllers/Settings/SecurityController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/settings/security` | `security.edit` | `edit` | `web`, `auth`, `verified` |
| `PUT` | `/settings/password` | `user-password.update` | `update` | `web`, `auth`, `verified`, `throttle:6,1` |

## Halaman Inertia

- `resources/js/pages/settings/security`

