---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/ValueChainJobdeskController.php
generated: 2026-09-15
---

# ValueChainJobdeskController

> [!info] Controller
> - File: `app/Http/Controllers/ValueChainJobdeskController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/value-chain-jobdesk` | `value-chain-jobdesk.index` | `index` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `POST` | `/value-chain-jobdesk` | `value-chain-jobdesk.store` | `store` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `PUT` | `/value-chain-jobdesk/{profile}` | `value-chain-jobdesk.update` | `update` | `web`, `auth`, `verified`, `role.level:superadmin` |
| `DELETE` | `/value-chain-jobdesk/{profile}` | `value-chain-jobdesk.destroy` | `destroy` | `web`, `auth`, `verified`, `role.level:superadmin` |

## Model terkait

- [[Organization]]
- [[OrganizationProfile]]

## Halaman Inertia

- `resources/js/pages/ValueChainJobdesk/Index`

