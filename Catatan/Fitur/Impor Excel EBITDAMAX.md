---
tags:
  - ebitdamax
  - fitur
type: fitur
generated: 2026-09-15
---

# Impor Excel EBITDAMAX

- Upload file `.xlsx` atau `.xls` dari halaman import.
- Parser membaca sheet prioritas seperti `WIP - EBITDA Matrix #3`, `EBITDA Matrix`, atau `Dashboard`.
- Upsert data EBITDA berdasarkan organisasi, tahun, periode, dan skenario.
- Pencatatan status import, jumlah baris berhasil/gagal, file asal, sheet asal, payload mentah, dan error log.
- Deteksi kode organisasi dari header Excel lalu memetakan ke master organisasi.

## Kode terkait

- Controller: [[DashboardController]]

