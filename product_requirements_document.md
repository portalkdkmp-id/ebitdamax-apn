# PRD — EBITDA Max APN

Dokumen kebutuhan produk (PRD) untuk aplikasi EBITDA Max APN berdasarkan analisis kode sumber repository.

## 1. Tujuan Produk
- Tujuan utama: menyediakan portal terintegrasi untuk perencanaan, pemantauan, dan pelaporan kinerja EBITDA khususnya untuk skenario KDKMP Gerai dan konsolidasi nasional.
- Sasaran bisnis: tingkatkan akurasi perencanaan pendapatan, monitoring operasi KDKMP, dan mempercepat siklus perbaikan operasi melalui laporan tugas & meeting action items.

## 2. Ringkasan Sistem (sekilas)
- Stack: Laravel 13 (PHP 8.3) + Inertia + React (TS). Import Excel via `maatwebsite/excel`.
- Fitur inti: autentikasi & passkeys, dashboard EBITDA, impor Excel, workflow KDKMP (business process, unit cost, revenue plan, plan EBITDA matrix), monitoring peta KDKMP, task reporting, meeting minutes, value-chain/jobdesk.

## 3. Pengguna dan Peran
- `superadmin`: akses penuh (master data, import, monitoring nasional).
- `manager`: manajemen regional / action items / monitoring area.
- `staff` / `ebitda_kdkmp`: input data harian KDKMP, menjalankan task, upload foto/dokumen.
- Stakeholder pemangku kepentingan: tim operasi KDKMP, tim keuangan (EBITDA), admin nasional, product owner business unit.

## 4. Ruang Lingkup (in-scope / out-of-scope)
- In-scope: seluruh modul yang ada di repo — organisasi, import Excel, revenue plan, unit cost assumption, plan ebitda matrix, dashboard KDKMP, task start/finish, meeting minutes, monitoring peta.
- Out-of-scope: integrasi eksternal tambahan (payment gateway), modul analitik ML lanjutan, deployment infra (diluar rekomendasi NFR).

## 5. Fitur Utama (deskripsi + acceptance criteria singkat)
1. Autentikasi & Keamanan
   - Login, 2FA, passkeys, email verified.
   - AC: user bisa mendaftar/login, admin bisa mengatur role; passkeys dapat didaftarkan.
2. Dashboard EBITDA (Korporat & Drill-down)
   - Ringkasan EBITDA per tahun/skenario, drill-down per directorate/org subtree.
   - AC: dashboard menampilkan agregat revenue/TOC/EBITDA dan drill-down subtree.
3. Import Excel EBITDAMAX
   - Parser sheet prioritas, upsert data dengan log import & error.
   - AC: file import menghasilkan catatan `excel_imports` dan `import_error_logs` bila ada masalah.
4. Workflow KDKMP Gerai
   - Business process, Unit Cost, Revenue Plan, Plan EBITDA Matrix per data owner.
   - AC: owner bisa create/update tiap modul; PlanEbitdaMatrix hanya create jika dependensi lengkap.
5. Task Management & Reporting
   - Start/Finish task, upload foto/dokumen, additional fields, member allocation.
   - AC: staff dapat `POST /tasks/{task}/start` dan `POST /tasks/{task}/finish`; laporan disimpan dan foto/dokumen tersedia untuk preview/download.
6. Monitoring Nasional & Peta
   - Peta Leaflet, metadata & binary map points, KPI gap revenue.
   - AC: admin dapat melihat titik KDKMP, filter regional, dan grafik gap revenue.
7. Meeting Minutes & Action Items
   - CRUD meeting, action items dengan status dan riwayat.
   - AC: manager dapat lihat/ubah status action items; attachment preview/download berfungsi.
8. Value Chain / Jobdesk
   - CRUD profil jobdesk per organisasi, tree view.
   - AC: admin/ops dapat import/manual CRUD profile dan menavigasi hirarki organisasi.

## 6. Data & Integritas (kunci)
- Entitas utama: `users`, `roles`, `organizations`, `organization_profiles`, `organization_calculations`, `ebitda_values`, `excel_imports`, `ebitdamax_kdkmp`, `task_reports`, `meeting_minutes`, `business_processes`, `revenue_plans`, `unit_cost_assumptions`, `plan_ebitda_matrices`.
- Import Excel: harus mencatat source_sheet, payload mentah, mapping kode organisasi.
- Konsistensi: kalkulasi EBITDA via service-layer (`EbitdaFormulaService` / `EbitdaOrganizationValueService`) — hindari duplikasi logika di frontend.

## 7. API / Endpoints Penting (ringkasan)
- Dashboard & KDKMP
  - `GET /dashboard` (redirect ke dashboard sesuai domain)
  - `GET /dashboard/kdkmp` — tampilan KDKMP
  - `PUT /dashboard/kdkmp/today` — upsert data harian KDKMP
- Tasks
  - `POST /tasks/{task}/start`
  - `POST /tasks/{task}/finish`
  - `/task-reports/.../photos` preview/download
- Imports
  - `POST /excel-imports` (controller: `ExcelImportController`) — import XLSX/XLS
- KDKMP workflows
  - `GET|POST|PUT /business-processes/kdkmp-gerai`
  - `GET|POST|PUT /unit-cost-assumptions/kdkmp-gerai`
  - `GET|POST|PUT /revenue-plans/kdkmp-gerai`
  - `GET|POST|PUT /plan-ebitda-matrices/kdkmp-gerai`

## 8. User Flows (top 3)
1. Superadmin: import Excel → validate → periksa `excel_imports` → konfirmasi mapping organisasi.
2. Data owner KDKMP: siapkan Business Process → isi Unit Cost & Revenue Plan → generate Plan EBITDA Matrix → publish.
3. Field staff: buka dashboard tugas → `Mulai Task` (upload foto start, input additional fields) → `Selesaikan Task` (upload foto finish) → data dipakai untuk KPI harian dan scoring.

## 9. Keamanan & Otorisasi
- Role-level middleware (`EnsureRoleLevel`) dan domain enforcement (`EnsureEbitdamaxDomain`).
- Row-level access untuk KDKMP via `SdmKdkmpEntry::accessibleBy($user)` dan panduan RLS (docs/kdkmp-row-level-security.md).
- Requirement: semua API sensitif harus lewat `auth` & `verified` middleware.

## 10. Non-Functional Requirements
- Performance: dashboard agregasi harus bergantung pada precomputed aggregates/cached queries untuk subtree besar.
- Scalability: import Excel harus diproses asinkron (queue) untuk file besar; ada monitoring job failures.
- Reliability: backup DB harian; logging dan alert pada import error spike.
- Security: TLS, input validation, file upload size/type limits, access audit logs.
- Observability: metrics untuk import success/failure, task throughput, dashboard query latency.

## 11. Acceptance Criteria & Success Metrics
- AC umum: tiap modul CRUD, upload/preview/download dokumen, dan protected routes berjalan sesuai role.
- Metrics: akurasi data ( <2% mapping errors pada import), task completion rate target 90%, dashboard response <1s for cached views.

## 12. Milestones & Rencana Pengiriman (contoh 6 minggu)
- Sprint 1 (2 minggu): Stabilkan import Excel (parser + error logging), master data organisasi, auth & roles.
- Sprint 2 (2 minggu): KDKMP workflow (business process, unit cost, revenue plan) + Plan EBITDA Matrix.
- Sprint 3 (2 minggu): Task reporting, meeting minutes, dashboard & monitoring, polish UX, tests.

## 13. Risiko & Mitigasi
- Risiko: Import mapping organisasi salah → Mitigasi: preview mapping step, rollback partial import, logging error detail.
- Risiko: query dashboard lambat pada subtree besar → Mitigasi: caching, incremental aggregates, DB indexes.
- Risiko: akses data regional leak → Mitigasi: enforce `SdmKdkmpEntry::accessibleBy`, terapkan PostgreSQL RLS bertahap.

## 14. Next Steps (operasional)
1. Validasi PRD dengan pemilik produk & tim operasi (konfirmasi acceptance criteria).
2. Tentukan prioritas awal (import stabilisasi vs KDKMP workflow) dan alokasikan sprint.
3. Siapkan environment staging, tes import end-to-end, dan jalankan suite test (`composer test`).
4. Jika setuju, saya bisa: membuat PR dari perubahan kecil (mis. dokumentasi), atau memecah milestone menjadi issue/ticket.

---
Dokumen dibuat otomatis berdasarkan struktur kode dan README repository.

