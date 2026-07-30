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

export type KdkmpDailyEntry = {
    id: number;
    report_date: string;
    target_revenue: number | null;
    actual_revenue: number | null;
    cost: number | null;
    total_duration_minutes: number | null;
    duration_hours: number | null;
    duration_minutes: number | null;
    performance_score: number | null;
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
    daily_entry: Pick<
        KdkmpDailyEntry,
        | 'target_revenue'
        | 'actual_revenue'
        | 'cost'
        | 'total_duration_minutes'
        | 'performance_score'
        | 'is_complete'
        | 'updated_at'
    > | null;
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
