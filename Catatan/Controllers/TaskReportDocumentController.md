---
tags:
  - ebitdamax
  - controller
type: controller
source: app/Http/Controllers/TaskReportDocumentController.php
generated: 2026-09-15
---

# TaskReportDocumentController

> [!info] Controller
> - File: `app/Http/Controllers/TaskReportDocumentController.php`
> - Indeks: [[Indeks]]

## Rute

| Method | URI | Name | Action | Middleware |
| --- | --- | --- | --- | --- |
| `GET` | `/task-reports/{taskReport}/documents/{phase}/{documentIndex}/preview` | `task-reports.documents.preview` | `preview` | `web`, `auth`, `verified` |
| `GET` | `/task-reports/{taskReport}/documents/{phase}/{documentIndex}/download` | `task-reports.documents.download` | `download` | `web`, `auth`, `verified` |
| `GET` | `/task-reports/{taskReport}/photos/{phase}/preview` | `task-reports.photos.preview` | `previewPhoto` | `web`, `auth`, `verified` |
| `GET` | `/task-reports/{taskReport}/photos/{phase}/download` | `task-reports.photos.download` | `downloadPhoto` | `web`, `auth`, `verified` |
| `GET` | `/task-reports/{taskReport}/additional-fields/{taskReportValue}/preview` | `task-reports.additional-fields.preview` | `previewAdditionalField` | `web`, `auth`, `verified` |
| `GET` | `/task-reports/{taskReport}/additional-fields/{taskReportValue}/download` | `task-reports.additional-fields.download` | `downloadAdditionalField` | `web`, `auth`, `verified` |

## Model terkait

- [[TaskReport]]
- [[TaskReportValue]]

