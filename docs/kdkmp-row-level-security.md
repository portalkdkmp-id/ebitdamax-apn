# Keamanan Akses Wilayah KDKMP

## Batas Akses Aplikasi

Dashboard KDKMP memakai dua lapisan akses:

1. Role menentukan hak membuka Consolidated View.
   - `superadmin`: cakupan nasional.
   - role `manager-wilayah`: memerlukan assignment wilayah.
   - role `ebitda_kdkmp`: memerlukan assignment wilayah atau relasi KDKMP miliknya.
2. `SdmKdkmpEntry::accessibleBy($user)` adalah batas data wajib. Query monitoring, grafik revenue, konsolidasi, dan detail task semuanya harus dimulai dari scope ini. Parameter URL tidak pernah menjadi sumber otorisasi.

`user_regional_assignments` mendukung tiga cakupan: `province`, `regency`, dan `district`. Satu user dapat memiliki beberapa assignment. Role KDKMP (`ebitda_kdkmp`) hanya boleh diberi cakupan `regency` atau `district`; Manager Wilayah (`manager-wilayah`) dapat diberi cakupan provinsi atau beberapa kabupaten/kecamatan. User KDKMP yang memiliki `sdm_kdkmp_entry_id` tetap hanya dapat melihat KDKMP miliknya bila tidak mempunyai assignment tambahan.

## Operasional Assignment

Superadmin mengatur assignment dari menu **Users**. Pilih role Manager Wilayah atau KDKMP, lalu tambahkan satu atau lebih cakupan wilayah. Superadmin selalu nasional dan tidak memerlukan assignment.

Jangan memberikan assignment nasional pada tabel ini. Cakupan nasional hanya ditentukan oleh role level `superadmin`.

## PostgreSQL Row-Level Security

Scope Laravel melindungi semua jalur aplikasi yang memakai model tersebut. PostgreSQL RLS adalah lapisan tambahan untuk membatasi query yang salah atau endpoint baru yang lupa memasang scope. Jangan mengaktifkannya langsung di production sebelum prasyarat berikut dipenuhi:

1. Buat role database khusus aplikasi, misalnya `ebitdamax_app`, yang bukan superuser, bukan pemilik tabel, dan tidak memiliki atribut `BYPASSRLS`.
2. Jalankan migration dengan role pemilik schema terpisah. Gunakan `ebitdamax_app` hanya pada koneksi runtime Laravel.
3. Bungkus seluruh request terautentikasi dalam transaksi dan panggil `set_config('app.current_user_id', '<id>', true)` sebelum query pertama. Nilai `true` membuat konteks hanya hidup pada transaksi tersebut, sehingga tidak bocor ke request berikutnya pada koneksi yang dipakai ulang.
4. Uji role superadmin, manager tingkat provinsi, manager tingkat kabupaten, manager tingkat kecamatan, KDKMP satu koperasi, dan user tanpa assignment. User terakhir harus menerima data kosong atau 403, bukan data nasional.

Contoh konteks per request di middleware Laravel:

```php
return DB::transaction(function () use ($request, $next) {
    DB::statement(
        "select set_config('app.current_user_id', ?, true)",
        [(string) $request->user()->id],
    );

    return $next($request);
});
```

Contoh kebijakan baca untuk `ebitdamax_kdkmp` berikut harus dijalankan oleh DBA setelah role runtime siap. Periksa nama user database dan lakukan uji di staging terlebih dahulu.

```sql
ALTER TABLE ebitdamax_kdkmp ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebitdamax_kdkmp FORCE ROW LEVEL SECURITY;

CREATE POLICY ebitdamax_kdkmp_select_by_region
ON ebitdamax_kdkmp
FOR SELECT
TO ebitdamax_app
USING (
    EXISTS (
        SELECT 1
        FROM users AS users
        JOIN roles AS roles ON roles.id = users.role_id
        WHERE users.id = NULLIF(current_setting('app.current_user_id', true), '')::bigint
          AND roles.level = 'superadmin'
    )
    OR EXISTS (
        SELECT 1
        FROM users AS users
        JOIN roles AS roles ON roles.id = users.role_id
        WHERE users.id = NULLIF(current_setting('app.current_user_id', true), '')::bigint
          AND roles.slug IN ('manager-wilayah', 'ebitda_kdkmp')
          AND users.sdm_kdkmp_entry_id = ebitdamax_kdkmp.sdm_kdkmp_entry_id
    )
    OR EXISTS (
        SELECT 1
        FROM users AS users
        JOIN roles AS roles ON roles.id = users.role_id
        JOIN user_regional_assignments AS assignments
          ON assignments.user_id = users.id
        JOIN sdm_kdkmp_entries AS entries
          ON entries.id = ebitdamax_kdkmp.sdm_kdkmp_entry_id
        WHERE users.id = NULLIF(current_setting('app.current_user_id', true), '')::bigint
          AND roles.slug IN ('manager-wilayah', 'ebitda_kdkmp')
          AND entries.provinsi = assignments.provinsi
          AND (
              assignments.scope_level = 'province'
              OR (
                  assignments.scope_level = 'regency'
                  AND entries.kota_kabupaten = assignments.kota_kabupaten
              )
              OR (
                  assignments.scope_level = 'district'
                  AND entries.kota_kabupaten = assignments.kota_kabupaten
                  AND entries.kecamatan = assignments.kecamatan
              )
          )
    )
);
```

Buat kebijakan `INSERT` dan `UPDATE` terpisah dengan `WITH CHECK` yang hanya mengizinkan user mengubah `sdm_kdkmp_entry_id` miliknya sendiri. Jangan memakai kebijakan `USING (true)` untuk write. Setelah RLS aktif, PostgreSQL menerapkan default-deny bila policy tidak ada; pemilik tabel dan role `BYPASSRLS` biasanya melewati policy, sehingga pemisahan role database adalah wajib.
