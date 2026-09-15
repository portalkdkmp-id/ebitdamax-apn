---
tags:
  - ebitdamax
  - fitur
type: fitur
generated: 2026-09-15
---

# Task Management dan Reporting

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

## Kode terkait

- Model: [[Role]]
- Model: [[Task]]
- Model: [[TaskReport]]
- Controller: [[DashboardController]]
- Controller: [[RoleController]]
- Controller: [[TaskController]]
- Controller: [[TaskReportController]]

