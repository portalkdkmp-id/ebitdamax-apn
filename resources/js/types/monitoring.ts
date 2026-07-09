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

export type StockSummary = {
    stock_berputar: number;
    active_sku: number;
    jumlah_sku: number;
};

export type ProdukSubsidiSummary = {
    total_sku_subsidi: number;
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
    stock: StockSummary;
    produk_subsidi: ProdukSubsidiSummary;
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
