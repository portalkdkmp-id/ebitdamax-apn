---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/LarkSsoController.php
generated: 2026-09-15
---

# LarkSsoController

> [!info] Controller
> - File: `app/Http/Controllers/LarkSsoController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/auth/lark/redirect` | `auth.lark.redirect` | `redirect` | `web`, `guest` |
| `GET` | `/auth/lark/callback` | `auth.lark.callback` | `callback` | `web`, `guest` |
| `POST` | `/auth/lark/h5` | `auth.lark.h5` | `h5` | `web`, `guest`, `throttle:login` |

## Model terkait

- [[User]]

