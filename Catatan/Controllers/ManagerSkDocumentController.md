---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/ManagerSkDocumentController.php
generated: 2026-09-15
---

# ManagerSkDocumentController

> [!info] Controller
> - File: `app/Http/Controllers/ManagerSkDocumentController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/users/{user}/manager-sk-document/preview` | `users.manager-sk-document.preview` | `preview` | `web`, `auth`, `verified` |
| `POST` | `/users/{user}/manager-sk-document` | `users.manager-sk-document.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[User]]

