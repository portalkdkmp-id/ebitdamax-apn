# EBITDA Max APN

EBITDA Max APN adalah aplikasi internal berbasis Laravel dan Inertia React untuk mengelola perencanaan, pemantauan, dan pelaporan kinerja EBITDA Agrinas/APN, termasuk workflow KDKMP Gerai, dashboard operasional, task reporting, meeting minutes, dan impor data dari Excel.

## Ringkasan Sistem

Aplikasi ini menggabungkan data keuangan, struktur organisasi, data koperasi, dan aktivitas operasional harian dalam satu portal. Pengguna dengan peran berbeda dapat mengakses dashboard, mengisi laporan, mengelola master data, mengunggah dokumen pendukung, serta memantau progres KDKMP secara nasional maupun per unit.

Stack utama:

- Backend: Laravel 13, PHP 8.3, Fortify, Laravel Passkeys, Laravel Wayfinder.
- Frontend: Inertia React 3, React 19, TypeScript, Vite, Tailwind CSS 4.
- UI dan visualisasi: Radix UI, lucide-react, Recharts, Leaflet, XYFlow/Dagre.
- Data processing: PhpSpreadsheet melalui `maatwebsite/excel`.
- Quality tools: Pest 4, PHPUnit 12, Larastan/PHPStan, Pint, ESLint, Prettier.

## Fitur Utama

### Autentikasi dan Keamanan

- Login, reset password, verifikasi email, dan konfirmasi password melalui Laravel Fortify.
- Two-factor authentication.
- Passkeys/WebAuthn untuk pendaftaran dan verifikasi perangkat.
- Pengaturan profil, password, keamanan, dan tampilan.
- Hak akses berbasis role level: `staff`, `manager`, dan `superadmin`.

### Dashboard EBITDA Korporat

- Dashboard eksekutif untuk ringkasan EBITDA berdasarkan tahun dan skenario.
- Drill-down dashboard per direktorat/unit organisasi.
- Visualisasi pendapatan, breakdown biaya, EBITDA per direktorat, ranking margin, dan alert EBITDA negatif.
- Struktur pohon organisasi untuk membaca kontribusi nilai dari anak organisasi ke parent.
- Skenario data: target tahunan, target harian, plan harian, dan aktual harian.

### Struktur Organisasi dan Nilai EBITDA

- CRUD organisasi dengan struktur parent-child.
- CRUD nilai EBITDA per organisasi, tahun, skenario, dan metrik.
- Profil organisasi dan konfigurasi kalkulasi per organisasi.
- Kalkulasi otomatis:
  - TOC = DOC variable + DOC fixed + IOC.
  - EBITDA = revenue - TOC.
  - EBITDA margin berdasarkan revenue dan EBITDA.

### Impor Excel EBITDAMAX

- Upload file `.xlsx` atau `.xls` dari halaman import.
- Parser membaca sheet prioritas seperti `WIP - EBITDA Matrix #3`, `EBITDA Matrix`, atau `Dashboard`.
- Upsert data EBITDA berdasarkan organisasi, tahun, periode, dan skenario.
- Pencatatan status import, jumlah baris berhasil/gagal, file asal, sheet asal, payload mentah, dan error log.
- Deteksi kode organisasi dari header Excel lalu memetakan ke master organisasi.

### Value Chain Jobdesk

- Import dan pengelolaan profil/value chain jobdesk organisasi.
- Mendukung halaman khusus untuk melihat dan memperbarui data jobdesk.
- Data terhubung dengan organisasi dan riwayat import Excel.

### Workflow KDKMP Gerai

- Modul business process KDKMP Gerai.
- Modul unit cost assumption KDKMP Gerai.
- Modul revenue plan KDKMP Gerai.
- Modul plan EBITDA matrix KDKMP Gerai.
- Setiap data workflow dapat dibuat per pengguna/data owner sehingga pengguna KDKMP dapat menyusun proses, asumsi biaya, rencana pendapatan, dan matriks EBITDA secara terpisah.

### Dashboard KDKMP

- Dashboard KDKMP untuk pengguna terkait.
- Form update data harian KDKMP melalui endpoint `dashboard/kdkmp/today`.
- Monitoring admin KDKMP untuk melihat status KDKMP, task harian, dan detail per tanggal.
- Perhitungan performa KDKMP mencakup plan revenue, actual revenue, EBITDA margin, dan scoring performa.
- Analitik gap pendapatan dan distribusi SKU untuk kebutuhan monitoring.

### Data SDM KDKMP

- Halaman `sdm-data` untuk memperbarui jumlah karyawan dan data terkait KDKMP.
- Import referensi koperasi dari file ekspor "Laporan Koperasi".
- NIK koperasi menjadi identifier unik.
- Resolusi provinsi otomatis dari data wilayah lokal.

### Monitoring Nasional

- Halaman monitoring dengan peta KDKMP berbasis Leaflet.
- Endpoint metadata dan binary map points untuk memuat titik peta secara efisien.
- Chart indikator, revenue gap, dan distribusi SKU.
- Data sarpras/status point KDKMP digunakan untuk memantau kesiapan dan status operasional.

### Task Management dan Reporting

- Master role, kategori tugas, dan tugas.
- Penugasan tugas ke banyak role.
- Periode tugas: sekali, harian, mingguan, bulanan.
- Start/finish task report oleh staff, manager, atau superadmin.
- Additional field dinamis untuk laporan tugas.
- Upload foto dan dokumen pendukung pada fase start dan finish.
- Perhitungan metrik harian KDKMP:
  - actual cost dari laporan tugas pengeluaran harian,
  - total durasi pengerjaan,
  - task completion rate,
  - time compliance rate berdasarkan threshold waktu tugas.
- Dashboard tugas aktif dan riwayat tugas selesai.

### Meeting Minutes

- CRUD meeting minutes.
- Action items dengan status dan riwayat perubahan status.
- Upload, preview, dan download attachment meeting.
- Halaman action items untuk manager dan superadmin.

### Lumbung KMS

- Halaman `lumbung-kms/chat` untuk akses chat knowledge management.
- Saat ini route dan page tersedia sebagai bagian portal aplikasi.

## Arsitektur Aplikasi

### Lapisan Backend

Backend mengikuti pola Laravel konvensional:

- `routes/web.php` mendefinisikan route Inertia, grouping autentikasi, dan role middleware.
- `app/Http/Controllers` menangani request, validasi ringan, response Inertia, dan redirect.
- `app/Http/Requests` berisi Form Request untuk validasi create/update domain.
- `app/Models` merepresentasikan tabel dan relationship Eloquent.
- `app/Services` berisi logika domain yang lebih berat seperti parsing Excel, agregasi dashboard, formula EBITDA, analytics KDKMP, dan alert biaya.
- `app/Console/Commands` berisi command import/sync data operasional.
- `app/Enums` menampung enum role level, periode tugas, status laporan, dan konfigurasi field dinamis.

### Lapisan Frontend

Frontend menggunakan Inertia React:

- Entry point aplikasi: `resources/js/app.tsx`.
- Halaman Inertia: `resources/js/pages`.
- Layout utama: `resources/js/layouts`.
- Komponen reusable: `resources/js/components`.
- Komponen UI dasar: `resources/js/components/ui`.
- TypeScript domain types: `resources/js/types`.
- Styling global: `resources/css/app.css`.

Wayfinder digunakan untuk menghasilkan helper route/action TypeScript dari route Laravel.

### Modul Domain

| Domain | Backend | Frontend |
| --- | --- | --- |
| Dashboard EBITDA | `DashboardController`, `EbitdaDashboardService`, `EbitdaOrganizationValueService` | `pages/Dashboard`, `components/dashboard` |
| EBITDA Tree | `EbitdaTreeController` | `pages/EbitdaTree`, `components/ebitda-tree` |
| Import Excel | `ExcelImportController`, `EbitdaExcelParser` | `pages/Import` |
| Organisasi | `OrganizationController`, `Organization`, `OrganizationProfile` | `pages/Organizations` |
| Kalkulasi | `OrganizationCalculationController`, `EbitdaFormulaService` | `pages/Calculations` |
| KDKMP Dashboard | `KdkmpDashboardController`, `KdkmpDashboardMetricsService`, `KdkmpRevenueAnalyticsService` | `pages/KdkmpDashboard` |
| Monitoring | `MonitoringDashboardController`, `MonitoringDashboardService` | `pages/Monitoring`, `components/monitoring` |
| Task | `TaskController`, `TaskReportController`, `TaskDashboardController` | `pages/Tasks`, `pages/TaskDashboard` |
| Meeting Minutes | `MeetingMinuteController`, `MeetingActionItemController` | `pages/MeetingMinutes` |
| Master User/Role | `UserController`, `RoleController` | `pages/Users`, `pages/Roles` |
| Workflow KDKMP | `BusinessProcessController`, `UnitCostAssumptionController`, `RevenuePlanController`, `PlanEbitdaMatrixController` | `pages/BusinessProcesses`, `pages/UnitCostAssumptions`, `pages/RevenuePlans`, `pages/PlanEbitdaMatrices` |

## Model Data Inti

Entitas utama:

- `users`: akun pengguna, role, username, two-factor, passkey, dan relasi ke data KDKMP.
- `roles`: role aplikasi dengan level akses.
- `organizations`: struktur organisasi hierarkis.
- `organization_profiles`: profil/value chain organisasi.
- `organization_calculations`: konfigurasi dan hasil kalkulasi organisasi.
- `ebitda_values`: nilai revenue, DOC-V, DOC-F, IOC, TOC, EBITDA, dan margin.
- `excel_imports` dan `import_error_logs`: riwayat import dan error parsing.
- `sdm_kdkmp_entries`: master data KDKMP/koperasi dan jumlah karyawan.
- `koperasi_sarpras_status_points`: titik monitoring status sarpras/operasional.
- `ebitdamax_kdkmp`: data harian KDKMP, revenue, margin, dan scoring.
- `business_processes` dan `business_process_steps`: proses bisnis KDKMP.
- `unit_cost_assumptions` dan `unit_cost_assumption_rows`: asumsi unit cost.
- `revenue_plans` dan `revenue_plan_rows`: rencana pendapatan.
- `plan_ebitda_matrices`, `plan_ebitda_matrix_processes`, dan `plan_ebitda_matrix_rows`: matriks rencana EBITDA.
- `task_categories`, `tasks`, `task_additional_fields`: konfigurasi tugas.
- `task_reports` dan `task_report_values`: laporan pengerjaan tugas.
- `meeting_minutes`, `meeting_minute_items`, `meeting_minute_item_status_histories`, dan `meeting_minute_attachments`: notulen, action item, riwayat status, dan lampiran.

## Hak Akses

Semua halaman utama berada di balik middleware `auth` dan mayoritas membutuhkan `verified`.

- `staff`: akses dashboard tugas, start/finish task, dashboard KDKMP sesuai konteks user.
- `manager`: akses staff ditambah action items meeting.
- `superadmin`: akses penuh ke dashboard admin, master data, import Excel, monitoring, organisasi, role, user, task setup, nilai EBITDA, dan kalkulasi.

Middleware `role.level` berada di `app/Http/Middleware/EnsureRoleLevel.php`.

## Alur Data Utama

1. Superadmin menyiapkan master organisasi, role, user, task, dan kategori tugas.
2. Data EBITDA dapat masuk lewat import Excel atau CRUD nilai EBITDA.
3. Service dashboard menghitung agregasi per organisasi dan subtree.
4. Pengguna KDKMP mengisi business process, unit cost assumption, revenue plan, dan plan EBITDA matrix.
5. Staff/manager menjalankan task harian melalui start/finish report, termasuk upload dokumen/foto dan pengisian field tambahan.
6. Data laporan tugas dipakai untuk metrik KDKMP harian.
7. Admin memantau monitoring nasional, peta, dashboard KDKMP, gap revenue, dan status task.
8. Meeting minutes mencatat keputusan, action item, attachment, dan perubahan status.

## Struktur Direktori Penting

```text
app/
  Console/Commands/          Command import dan sinkronisasi data
  Enums/                     Enum domain
  Http/Controllers/          Controller web/Inertia
  Http/Middleware/           Middleware aplikasi
  Http/Requests/             Validasi Form Request
  Models/                    Model Eloquent
  Services/                  Logika domain dan agregasi
database/
  data/                      Referensi wilayah JSON
  factories/                 Factory test
  migrations/                Skema database
resources/
  css/                       Styling Tailwind
  js/
    components/              Komponen React reusable
    layouts/                 Layout Inertia
    pages/                   Halaman Inertia
    types/                   TypeScript types domain
routes/
  web.php                    Route aplikasi utama
  settings.php               Route profil, password, security, appearance
```

## Setup Lokal

Persyaratan:

- PHP 8.3.
- Composer.
- Node.js dan npm.
- SQLite untuk pengembangan lokal, atau PostgreSQL/MySQL sesuai konfigurasi deployment.

Instalasi cepat:

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm run build
```

Menjalankan aplikasi lokal:

```bash
composer run dev
```

Atau jalankan backend dan Vite secara terpisah:

```bash
php artisan serve
npm run dev
```

## Command Operasional

Command yang tersedia untuk data operasional:

```bash
php artisan import:koperasi-karyawan /path/ke/Export_Laporan_Koperasi_*.xlsx
php artisan import:koperasi-operasional /path/ke/file.xlsx
php artisan sync:koperasi-sarpras-status
```

Gunakan `php artisan list` dan `php artisan <command> --help` untuk melihat opsi terbaru setiap command.

## Impor Data Koperasi

Tabel `sdm_kdkmp_entries` yang digunakan oleh halaman `/monitoring` dan `/sdm-data` diisi dari berkas ekspor "Laporan Koperasi" data pembangunan (`Export_Laporan_Koperasi_*.xlsx`), bukan diketik manual. NIK koperasi digunakan sebagai identifier unik.

### Menjalankan Impor Lokal

```bash
php artisan import:koperasi-karyawan /path/ke/Export_Laporan_Koperasi_*.xlsx
```

- Perintah ini melakukan upsert berdasarkan `nik`, sehingga aman dijalankan berulang kali untuk memperbarui data referensi.
- Kolom `jumlah_karyawan` yang sudah diisi oleh tim HC tidak akan tertimpa; hanya kolom referensi wilayah yang diperbarui.
- Kolom provinsi tidak tersedia pada berkas ekspor asli, sehingga nilainya diresolusi otomatis dari `database/data/wilayah-kabupaten-kota.json` dan `database/data/wilayah-provinsi.json`.

### Menjalankan Impor ke Production Laravel Cloud

Untuk menjalankan impor langsung ke database production dari mesin lokal:

1. Ambil connection string PostgreSQL dari Laravel Cloud dashboard pada bagian Database, Connection details.
2. Simpan salinan isi `.env` lokal terlebih dahulu sebelum diganti.
3. Ganti sementara konfigurasi database di `.env` lokal:

```env
DB_CONNECTION=pgsql
DB_HOST=<host dari Laravel Cloud>
DB_PORT=5432
DB_DATABASE=<nama database>
DB_USERNAME=<user>
DB_PASSWORD=<password>
```

4. Pastikan ekstensi `pdo_pgsql` PHP sudah terpasang secara lokal.
5. Jalankan `php artisan config:clear`.
6. Jalankan migrasi jika ada migrasi baru, lalu impor:

```bash
php artisan migrate --force
php artisan import:koperasi-karyawan /path/ke/Export_Laporan_Koperasi_*.xlsx
```

7. Wajib mengembalikan `.env` ke konfigurasi lokal, lalu jalankan `php artisan config:clear` kembali.

Jangan pernah mencantumkan kredensial database production ke `.env.example` atau berkas yang di-track git.

## Testing dan Quality Check

Jalankan pengecekan minimum sesuai perubahan:

```bash
php artisan test --compact
npm run types:check
npm run lint:check
npm run format:check
```

Untuk PHP formatting:

```bash
vendor/bin/pint --dirty --format agent
```

Untuk full check sesuai script Composer:

```bash
composer ci:check
```

## Build Frontend

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

SSR build jika diperlukan:

```bash
npm run build:ssr
```

## Deployment

Project ini dapat dideploy ke Laravel Cloud atau environment Laravel lain yang mendukung PHP 8.3, queue/cache/session storage, dan database production.

Checklist umum deployment:

- Set environment variable production.
- Jalankan `composer install --no-dev --optimize-autoloader`.
- Jalankan `php artisan key:generate` hanya untuk environment baru.
- Jalankan `php artisan migrate --force`.
- Jalankan `npm ci` dan `npm run build`.
- Jalankan cache optimizations sesuai kebutuhan environment.
- Pastikan storage link dan permission storage/cache benar.
- Pastikan credential database production tidak masuk repository.

## Catatan Pengembangan

- Ikuti struktur Laravel yang sudah ada; jangan membuat base folder baru tanpa kebutuhan jelas.
- Gunakan Form Request untuk validasi create/update domain.
- Gunakan service class untuk logika agregasi atau parsing yang kompleks.
- Gunakan route name dan Wayfinder untuk integrasi frontend.
- Jika perubahan frontend tidak muncul, jalankan ulang `npm run dev` atau `npm run build`.
- Dokumentasi tambahan hanya dibuat jika memang diminta.
