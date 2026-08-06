<?php

namespace Database\Seeders;

use App\Enums\RoleDomain;
use App\Enums\RoleLevel;
use App\Models\BusinessProcess;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class KdkmpGeraiBusinessProcessSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::query()->updateOrCreate(
            ['slug' => Role::SLUG_EBITDA_KDKMP],
            [
                'name' => Role::SLUG_EBITDA_KDKMP,
                'level' => RoleLevel::Staff,
                'domain' => RoleDomain::Kdkmp,
            ]
        );

        $user = User::query()->firstOrNew([
            'email' => User::EMAIL_KDKMP_GERAI,
        ]);
        $user->fill([
            'role_id' => $role->id,
            'name' => 'KDKMP GERAI',
        ]);

        if (! $user->exists) {
            $user->password = 'password';
        }

        if ($user->email_verified_at === null) {
            $user->email_verified_at = now();
        }

        $user->save();

        $businessProcess = BusinessProcess::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'code' => BusinessProcess::CODE_KDKMP_GERAI,
            ],
            [
                'name' => 'BUSINES PROCESS',
                'unit_name' => null,
                'unit_code' => null,
            ]
        );

        if (! $businessProcess->wasRecentlyCreated) {
            return;
        }

        $steps = $this->steps();

        foreach ($steps as $step) {
            $businessProcess->steps()->updateOrCreate(
                ['sequence' => $step['sequence']],
                $step
            );
        }
    }

    /**
     * @return array<int, array{
     *     sequence: int,
     *     process_group: string,
     *     detail_process: string,
     *     pic: string,
     *     standard_time_minutes: int,
     *     output_target: null,
     *     responsibility_value: int
     * }>
     */
    private function steps(): array
    {
        return [
            [
                'sequence' => 1,
                'process_group' => 'Persiapan & Opening Toko',
                'detail_process' => 'Menerima barang dari Principal dan mencocokan apakah sudah sesuai atau belum dengan po (Memeriksa kesesuaian jumlah karton, fisik produk, dan tanggal kedaluwarsa)',
                'pic' => 'Staf Gudang & Logistik',
                'standard_time_minutes' => 45,
                'output_target' => null,
                'responsibility_value' => 60,
            ],
            [
                'sequence' => 2,
                'process_group' => 'Persiapan & Opening Toko',
                'detail_process' => 'Melakukan Goodrecipt di WMS',
                'pic' => 'Staf Gudang & Logistik',
                'standard_time_minutes' => 20,
                'output_target' => null,
                'responsibility_value' => 30,
            ],
            [
                'sequence' => 3,
                'process_group' => 'Persiapan & Opening Toko',
                'detail_process' => 'Memindahkan barang dari gudang ke rak pajangan menggunakan metode FIFO/FEFO',
                'pic' => 'Staf Gudang & Logistik',
                'standard_time_minutes' => 25,
                'output_target' => null,
                'responsibility_value' => 20,
            ],
            [
                'sequence' => 4,
                'process_group' => 'Persiapan & Opening Toko',
                'detail_process' => 'Melakukan display barang di rak sesuai dengan planogram',
                'pic' => 'Pramuniaga',
                'standard_time_minutes' => 40,
                'output_target' => null,
                'responsibility_value' => 120,
            ],
            [
                'sequence' => 5,
                'process_group' => 'Persiapan & Opening Toko',
                'detail_process' => 'Menempel harga sesuai produk',
                'pic' => 'Pramuniaga',
                'standard_time_minutes' => 15,
                'output_target' => null,
                'responsibility_value' => 20,
            ],
            [
                'sequence' => 6,
                'process_group' => 'Persiapan & Opening Toko',
                'detail_process' => 'Melakukan briefing pagi; 1) mulai dengan Briefing Rencana Pencapaian EBITDA di hari tersebut, 2) dengan penjelasan Actual EBITDA Hari sebelum nya dan Plan EBITDA hari tersebut',
                'pic' => 'Kepala toko, Pramuniaga, Kasir',
                'standard_time_minutes' => 15,
                'output_target' => null,
                'responsibility_value' => 20,
            ],
            [
                'sequence' => 7,
                'process_group' => 'Persiapan & Opening Toko',
                'detail_process' => 'Menghitung modal awal laci kasir, membersihkan area toko, menyalakan lampu, AC, komputer POS kasir, mesin chiller/cold storage, membuka rolling door',
                'pic' => 'Kasir, Pramuniaga',
                'standard_time_minutes' => 20,
                'output_target' => null,
                'responsibility_value' => 15,
            ],
            [
                'sequence' => 8,
                'process_group' => 'Pelayanan Transaksi & Cashiering',
                'detail_process' => 'Memindai barang belanjaan konsumen',
                'pic' => 'Kasir',
                'standard_time_minutes' => 100,
                'output_target' => null,
                'responsibility_value' => 10,
            ],
            [
                'sequence' => 9,
                'process_group' => 'Pelayanan Transaksi & Cashiering',
                'detail_process' => 'Melayani pembayaran tunai, non-tunai',
                'pic' => 'Kasir',
                'standard_time_minutes' => 50,
                'output_target' => null,
                'responsibility_value' => 5,
            ],
            [
                'sequence' => 10,
                'process_group' => 'Pelayanan Transaksi & Cashiering',
                'detail_process' => 'Menawarkan produk promo upselling',
                'pic' => 'Kasir',
                'standard_time_minutes' => 15,
                'output_target' => null,
                'responsibility_value' => 5,
            ],
            [
                'sequence' => 11,
                'process_group' => 'Penerimaan Komoditas & Produk Lokal (Offtaker)',
                'detail_process' => 'Menerima setoran hasil bumi/ternak harian dari warga/petani lokal (misal: produk UMKM)',
                'pic' => 'Kepala toko / asisten toko',
                'standard_time_minutes' => 15,
                'output_target' => null,
                'responsibility_value' => 15,
            ],
            [
                'sequence' => 12,
                'process_group' => 'Penerimaan Komoditas & Produk Lokal (Offtaker)',
                'detail_process' => 'Melakukan Quality Control (QC) fisik cepat dan mencatatnya ke sistem kemitraan KDKMP',
                'pic' => 'Kepala toko / asisten toko',
                'standard_time_minutes' => 20,
                'output_target' => null,
                'responsibility_value' => 20,
            ],
            [
                'sequence' => 13,
                'process_group' => 'Penyusunan & Pengiriman Produk Lokal ke DC',
                'detail_process' => 'Mengonsolidasikan produk lokal yang sudah terkumpul di gudang gerai untuk dikirim kembali ke ToraSera guna penetrasi pasar eksternal. (jika sudah ada DC)',
                'pic' => 'Staf Gudang & Logistik',
                'standard_time_minutes' => 25,
                'output_target' => null,
                'responsibility_value' => 30,
            ],
            [
                'sequence' => 14,
                'process_group' => 'Administrasi, Pembukuan, & Setoran',
                'detail_process' => 'Mencocokkan total Kas di mesin kasir dengan laporan penjualan sistem POS dan melaporkan ke kepala/asisten toko',
                'pic' => 'Kasir',
                'standard_time_minutes' => 15,
                'output_target' => null,
                'responsibility_value' => 15,
            ],
            [
                'sequence' => 15,
                'process_group' => 'Administrasi, Pembukuan, & Setoran',
                'detail_process' => 'Menyiapkan uang kas untuk disetor ke bank mitra dan menyusun laporan harian',
                'pic' => 'Kasir',
                'standard_time_minutes' => 15,
                'output_target' => null,
                'responsibility_value' => 10,
            ],
            [
                'sequence' => 16,
                'process_group' => 'Proses Penutupan Toko (Closing & Housekeeping)',
                'detail_process' => 'Membersihkan seluruh lantai gerai, mematikan peralatan listrik yang tidak terpakai (kecuali chiller produk segar), mengunci brankas, dan mengunci pintu gerai, Stock opname dan mengecek produk OUT OF STOCK (melakukan pendataan untuk dilaporkan ke PIC AGRINAS)',
                'pic' => 'Pramuniaga',
                'standard_time_minutes' => 25,
                'output_target' => null,
                'responsibility_value' => 25,
            ],
            [
                'sequence' => 17,
                'process_group' => 'Mengecek target EBITDA',
                'detail_process' => 'Mengecekan ebitda aktual hari tersebut dan plan esok hari. Dengan 1) Merekam Actual EBITDA Hari tersebut, 2) Membuat Plan EBITDA Hari berikut, 3) Memeriksa Capacity Matrix, 4) Memaksimalkan Produktivitas dan Efisiensi semua sumber daya (4M: Man, Machine, Material, Method)',
                'pic' => 'Kepala toko',
                'standard_time_minutes' => 20,
                'output_target' => null,
                'responsibility_value' => 30,
            ],
        ];
    }
}
