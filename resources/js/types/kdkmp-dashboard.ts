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

export type KdkmpDashboardFields = {
    target_revenue: string | null;
    plan_revenue: string | null;
    actual_revenue: string | null;
    plan_cost: string | null;
    actual_cost: string | null;
    actual_ebitda_margin: string | null;
    total_duration: string | null;
    performance_scoring: string | null;
};

export type KdkmpComputedValues = Pick<
    KdkmpDashboardFields,
    'target_revenue' | 'actual_cost' | 'total_duration' | 'performance_scoring'
> & {
    task_completion_rate: number;
    time_compliance_rate: number;
};

export type KdkmpDailyEntry = KdkmpDashboardFields & {
    id: number;
    report_date: string;
    is_complete: boolean;
    plan_revenue_requires_review: boolean;
    updated_at: string | null;
};

export type KdkmpManagerDashboardProps = {
    businessDate: string;
    kdkmp: KdkmpIdentity | null;
    todayEntry: KdkmpDailyEntry | null;
    computedValues: KdkmpComputedValues;
    history: PaginatedResponse<KdkmpDailyEntry>;
};

export type KdkmpMonitoringEntry = KdkmpIdentity & {
    manager: {
        name: string;
        email: string;
        username: string | null;
    } | null;
    daily_entry:
        | (KdkmpDashboardFields &
              Pick<
                  KdkmpDailyEntry,
                  'is_complete' | 'plan_revenue_requires_review' | 'updated_at'
              >)
        | null;
};

export type KdkmpMonitoringProps = {
    businessDate: string;
    entries: PaginatedResponse<KdkmpMonitoringEntry>;
    summary: {
        total: number;
        complete: number;
        not_filled: number;
        requires_review: number;
    };
    filters: {
        date: string;
        search: string;
        status: 'all' | 'complete' | 'not_filled' | 'requires_review';
    };
};
