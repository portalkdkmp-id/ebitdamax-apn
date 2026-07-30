import type { PaginatedResponse } from '@/types/ebitda';

export type KdkmpIdentity = {
    id: number;
    nik: string | null;
    name: string;
    desa: string | null;
    kecamatan: string | null;
    kota_kabupaten: string | null;
    provinsi: string | null;
};

export type KdkmpManualFields = {
    target_revenue: string | null;
    plan_revenue: string | null;
    actual_revenue: string | null;
    target_cost: string | null;
    plan_cost: string | null;
    actual_cost: string | null;
    target_ebitda: string | null;
    plan_ebitda: string | null;
    actual_ebitda: string | null;
    target_ebitda_margin: string | null;
    actual_ebitda_margin: string | null;
    total_duration: string | null;
    performance_scoring: string | null;
};

export type KdkmpDailyEntry = KdkmpManualFields & {
    id: number;
    report_date: string;
    is_complete: boolean;
    updated_at: string | null;
};

export type KdkmpManagerDashboardProps = {
    businessDate: string;
    kdkmp: KdkmpIdentity | null;
    todayEntry: KdkmpDailyEntry | null;
    history: PaginatedResponse<KdkmpDailyEntry>;
};

export type KdkmpMonitoringEntry = KdkmpIdentity & {
    manager: {
        name: string;
        email: string;
        username: string | null;
    } | null;
    daily_entry:
        | (KdkmpManualFields &
              Pick<KdkmpDailyEntry, 'is_complete' | 'updated_at'>)
        | null;
};

export type KdkmpMonitoringProps = {
    businessDate: string;
    entries: PaginatedResponse<KdkmpMonitoringEntry>;
    summary: {
        total: number;
        complete: number;
        draft: number;
        not_filled: number;
    };
    filters: {
        date: string;
        search: string;
        status: 'all' | 'complete' | 'draft' | 'not_filled';
    };
};
