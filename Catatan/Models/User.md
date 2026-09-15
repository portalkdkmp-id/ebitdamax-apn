---
tags:
  - ebitdamax
  - model
type: model
table: users
source: app/Models/User.php
generated: 2026-09-15
---

# User

> [!info] Model Eloquent
> - Tabel: `users`
> - File: `app/Models/User.php`
> - Indeks: [[Indeks]]

## Mass Assignment (fillable)

- `role_id`
- `sdm_kdkmp_entry_id`
- `manager_sk_document`
- `name`
- `username`
- `email`
- `password`

## Casts

| Kolom | Tipe |
| --- | --- |
| `id` | `int` |
| `email_verified_at` | `datetime` |
| `has_completed_onboarding` | `boolean` |
| `manager_sk_document` | `array` |
| `password` | `hashed` |
| `two_factor_confirmed_at` | `datetime` |

## Relasi

| Method | Tipe | Model |
| --- | --- | --- |
| `role()` | BelongsTo | [[Role]] |
| `sdmKdkmpEntry()` | BelongsTo | [[SdmKdkmpEntry]] |
| `regionalAssignments()` | HasMany | [[UserRegionalAssignment]] |
| `businessProcesses()` | HasMany | [[BusinessProcess]] |
| `unitCostAssumptions()` | HasMany | [[UnitCostAssumption]] |
| `revenuePlans()` | HasMany | [[RevenuePlan]] |
| `planEbitdaMatrices()` | HasMany | [[PlanEbitdaMatrix]] |
| `customerAnalyses()` | HasMany | [[CustomerAnalysis]] |
| `passkeys()` | HasMany | [[Passkey]] |

## Digunakan oleh

- [[AnnouncementController]]
- [[BusinessProcessController]]
- [[CustomerAnalysisController]]
- [[KdkmpDashboardController]]
- [[KdkmpDashboardMonitoringController]]
- [[KdkmpDashboardTaskController]]
- [[LarkSsoController]]
- [[LmsKdkmpController]]
- [[ManagerSkDocumentController]]
- [[MeetingActionItemController]]
- [[MeetingMinuteController]]
- [[OnboardingController]]
- [[PlanEbitdaMatrixController]]
- [[RevenuePlanController]]
- [[ProfileController]]
- [[TaskDashboardController]]
- [[TaskReportController]]
- [[UnitCostAssumptionController]]
- [[UserController]]

