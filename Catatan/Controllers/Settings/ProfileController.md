---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/Settings/ProfileController.php
generated: 2026-09-15
---

# ProfileController

> [!info] Controller
> - File: `app/Http/Controllers/Settings/ProfileController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/settings/profile` | `profile.edit` | `edit` | `web`, `auth` |
| `PATCH` | `/settings/profile` | `profile.update` | `update` | `web`, `auth` |
| `DELETE` | `/settings/profile` | `profile.destroy` | `destroy` | `web`, `auth`, `verified` |

## Model terkait

- [[User]]

## Halaman Inertia

- `resources/js/pages/settings/profile`

