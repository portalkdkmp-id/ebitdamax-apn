import type { PaginatedResponse } from './ebitda';

export type SarprasCompletionSummary = {
    filter: { batch: string | null };
    data: {
        jumlah_koperasi_sarpras_mandatory_lengkap: number;
        jumlah_koperasi_sarpras_secondary_lengkap: number;
        jumlah_koperasi_sarpras_lengkap_semua: number;
    };
    meta: {
        mandatory_requirement_count: number;
        secondary_requirement_count: number;
        total_requirement_count: number;
        completed_statuses: string[];
        generated_at: string;
    };
};

export type PemetaanLahanStats = {
    stats: {
        total: number;
        sedang_diverifikasi: number;
        terverifikasi: number;
        dipertimbangkan_catatan: number;
        mulai_dibangun: number;
        ditolak: number;
        done_pembangunan: number;
        catatan: number;
        lp2b: number;
        luaslahan_15_20: number;
        terverifikasi_belum_bangun: number;
        perlu_verifikasi_lanjutan: number;
    };
    timestamp: string;
};

export type ExternalSection<T> = {
    status: 'ok' | 'error';
    data: T | null;
    fetched_at: string | null;
};

export type SdmSummary = {
    jumlah_kdkmp_ditambahkan: number;
    total_karyawan: number;
};

export type OperasionalOdooSummary = {
    total_kdkmp: number;
    kdkmp_sudah_dibuatkan_po: number;
    kdkmp_sudah_penerimaan_barang: number;
    kdkmp_sudah_penjualan: number;
    updated_at: string | null;
};

export type StockSummary = {
    jumlah_sku_terdaftar: number;
    jumlah_sku_aktif: number;
    jumlah_sku_subsidi: number;
    rata_rata_sku_per_kdkmp: number;
    min_sku_kdkmp: number;
    max_sku_kdkmp: number;
    total_kdkmp: number;
    distribusi_per_kdkmp: Array<{
        kdkmp_id: number;
        nama: string;
        sku_count: number;
    }>;
};

export type ProdukSubsidiSummary = {
    availability: {
        gerai: number;
        kabupaten: number;
        provinsi: number;
        nasional: number;
    };
};

export type MonitoringDashboardProps = {
    sarpras: ExternalSection<SarprasCompletionSummary>;
    pemetaan_lahan: ExternalSection<PemetaanLahanStats>;
    sdm: SdmSummary;
    operasional_odoo: OperasionalOdooSummary;
    stock: StockSummary;
    produk_subsidi: ProdukSubsidiSummary;
};

export type MarkerTier = 'status' | 'sarpras' | 'sdm' | 'odoo';
export type MarkerColor =
    'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'gray';

/**
 * Metadata titik peta (JSON) - field numerik/enum-nya ada di payload biner
 * terpisah (endpoint monitoring.map-points-binary), lihat
 * decodeMapPointsBinary() di KoperasiMap.tsx. Field string dedup lewat
 * tabel lookup (tables) untuk provinsi/kota-kabupaten/kecamatan/status
 * verifikasi karena banyak titik berbagi nilai yang sama; nik/nama/kodim
 * unik per titik jadi tetap dikirim sebagai array string.
 */
export type MapPointsMetaResponse = {
    status: 'ok' | 'error';
    fetched_at: string | null;
    count: number;
    tables: {
        provinsi: string[];
        kotaKabupaten: string[];
        kecamatan: string[];
        validationStatus: string[];
    };
    nik: (string | null)[];
    nama: (string | null)[];
    kodim: (string | null)[];
};

export type SdmEntry = {
    id: number;
    nik: string | null;
    nama_koperasi: string;
    provinsi: string | null;
    kota_kabupaten: string | null;
    kecamatan: string | null;
    jumlah_karyawan: number;
    updated_at: string | null;
};

export type SdmDataPageProps = {
    entries: PaginatedResponse<SdmEntry>;
    summary: SdmSummary;
    filters: { search: string };
};
