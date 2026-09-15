---
tags:
  - ebitdamax
  - moc
type: indeks
generated: 2026-09-15
---

# EBITDA Max APN — Indeks Kode

> [!abstract] Peta konten
> Indeks ini dibuat otomatis dari kode proyek. Jalankan `php artisan notes:generate` untuk menyegarkan.

## Fitur

- [[Autentikasi dan Keamanan]]
- [[Dashboard EBITDA Korporat]]
- [[Struktur Organisasi dan Nilai EBITDA]]
- [[Impor Excel EBITDAMAX]]
- [[Value Chain Jobdesk]]
- [[Workflow KDKMP Gerai]]
- [[Dashboard KDKMP]]
- [[Data SDM KDKMP]]
- [[Monitoring Nasional]]
- [[Task Management dan Reporting]]
- [[Meeting Minutes]]
- [[Lumbung KMS]]

## Model

| Model | Tabel | Relasi |
| --- | --- | --- |
| [[BusinessProcess]] | `business_processes` | 2 |
| [[BusinessProcessStep]] | `business_process_steps` | 1 |
| [[CustomerAnalysis]] | `customer_analyses` | 1 |
| [[EbitdaValue]] | `ebitda_values` | 2 |
| [[EbitdamaxKdkmp]] | `ebitdamax_kdkmp` | 3 |
| [[ExcelImport]] | `excel_imports` | 1 |
| [[ImportErrorLog]] | `import_error_logs` | 1 |
| [[KoperasiSarprasStatusPoint]] | `koperasi_sarpras_status_points` | 0 |
| [[MeetingMinute]] | `meeting_minutes` | 4 |
| [[MeetingMinuteAttachment]] | `meeting_minute_attachments` | 2 |
| [[MeetingMinuteItem]] | `meeting_minute_items` | 2 |
| [[MeetingMinuteItemStatusHistory]] | `meeting_minute_item_status_histories` | 2 |
| [[Organization]] | `organizations` | 6 |
| [[OrganizationCalculation]] | `organization_calculations` | 1 |
| [[OrganizationProfile]] | `organization_profiles` | 2 |
| [[PlanEbitdaMatrix]] | `plan_ebitda_matrices` | 6 |
| [[PlanEbitdaMatrixProcess]] | `plan_ebitda_matrix_processes` | 2 |
| [[PlanEbitdaMatrixRow]] | `plan_ebitda_matrix_rows` | 2 |
| [[RevenuePlan]] | `revenue_plans` | 2 |
| [[RevenuePlanRow]] | `revenue_plan_rows` | 1 |
| [[Role]] | `roles` | 2 |
| [[SdmKdkmpEntry]] | `sdm_kdkmp_entries` | 4 |
| [[Task]] | `tasks` | 4 |
| [[TaskAdditionalField]] | `task_additional_fields` | 1 |
| [[TaskCategory]] | `task_categories` | 1 |
| [[TaskReport]] | `task_reports` | 3 |
| [[TaskReportValue]] | `task_report_values` | 2 |
| [[UnitCostAssumption]] | `unit_cost_assumptions` | 2 |
| [[UnitCostAssumptionRow]] | `unit_cost_assumption_rows` | 1 |
| [[User]] | `users` | 9 |
| [[UserRegionalAssignment]] | `user_regional_assignments` | 1 |

## Controller

| Controller | Rute |
| --- | --- |
| [[AnnouncementController]] | 2 |
| [[BusinessProcessController]] | 3 |
| [[CustomerAnalysisController]] | 3 |
| [[DashboardController]] | 2 |
| [[DashboardRedirectController]] | 1 |
| [[EbitdaTreeController]] | 1 |
| [[EbitdaValueController]] | 4 |
| [[ExcelImportController]] | 2 |
| [[KdkmpDashboardController]] | 5 |
| [[KdkmpDashboardMonitoringController]] | 1 |
| [[KdkmpDashboardTaskController]] | 1 |
| [[LarkSsoController]] | 3 |
| [[LmsKdkmpController]] | 1 |
| [[LumbungChatController]] | 1 |
| [[ManagerSkDocumentController]] | 2 |
| [[MeetingActionItemController]] | 2 |
| [[MeetingMinuteController]] | 6 |
| [[MonitoringDashboardController]] | 3 |
| [[NotificationController]] | 3 |
| [[OnboardingController]] | 1 |
| [[OrganizationCalculationController]] | 4 |
| [[OrganizationController]] | 4 |
| [[PlanEbitdaMatrixController]] | 3 |
| [[ProfileController]] | 3 |
| [[RevenuePlanController]] | 3 |
| [[RoleController]] | 4 |
| [[SdmKdkmpEntryController]] | 2 |
| [[SecurityController]] | 2 |
| [[TaskCategoryController]] | 4 |
| [[TaskController]] | 4 |
| [[TaskDashboardController]] | 2 |
| [[TaskReportController]] | 2 |
| [[TaskReportDocumentController]] | 6 |
| [[UnitCostAssumptionController]] | 3 |
| [[UserController]] | 4 |
| [[ValueChainJobdeskController]] | 4 |

## Dokumentasi

- [[README]]
- [[deployment]]
- [[product_requirements_document]]
- [[kdkmp-row-level-security]]

