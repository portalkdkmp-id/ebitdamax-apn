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
    variable_cost: string | null;
    actual_cost: string | null;
    actual_ebitda_margin: string | null;
    total_duration: string | null;
    performance_scoring: string | null;
};

export type KdkmpOperationalAttendanceKey =
    | 'pramuniaga'
    | 'kasir'
    | 'karyawan_umkm'
    | 'security'
    | 'driver_truck'
    | 'driver_pickup'
    | 'driver_motor_roda_tiga';

export type KdkmpOperationalAttendance = Record<
    KdkmpOperationalAttendanceKey,
    number
>;

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
        operational_attendance: KdkmpOperationalAttendance;
        operational_attendance_saved_at: string | null;
        updated_at: string | null;
    };

export type KdkmpFinancialMatrixPoint = {
    process: number;
    task_id: number;
    task_name: string;
    estimated_minutes: number;
    actual_duration_minutes: number;
    plan_fixed_cost: number;
    plan_variable_cost: number;
    plan_cost: number;
    actual_fixed_cost: number;
    actual_variable_cost: number;
    actual_cost: number;
    cumulative_plan_cost: number;
    cumulative_actual_cost: number;
};

export type KdkmpFinancialMatrix = {
    fixed_cost: number;
    total_variable_cost: number;
    total_actual_variable_cost: number;
    total_estimated_minutes: number;
    total_actual_duration_minutes: number;
    total_plan_cost: number;
    total_actual_cost: number;
    plan_revenue: number | null;
    actual_revenue: number | null;
    plan_ebitda: number | null;
    actual_ebitda: number | null;
    points: KdkmpFinancialMatrixPoint[];
};

export type KdkmpRegionFilters = {
    provinsi: string | null;
    kota_kabupaten: string | null;
    kecamatan: string | null;
    desa: string | null;
};

export type KdkmpRegionOption = {
    provinsi: string;
    kota_kabupaten: string;
    kecamatan: string;
    desa: string;
};

export type KdkmpConsolidationLevel =
    'national' | 'province' | 'regency' | 'district' | 'village';

export type KdkmpRegionalAccess = {
    is_national: boolean;
    scope_label: string;
    locked_filters: KdkmpRegionFilters;
};

export type KdkmpConsolidationRow = {
    key: string;
    label: string;
    provinsi: string | null;
    kota_kabupaten: string | null;
    kecamatan: string | null;
    desa: string | null;
    total_kdkmp: number;
    complete_kdkmp: number;
    plan_revenue: number | null;
    actual_revenue: number | null;
    gap: number | null;
};

export type KdkmpManagerDashboardProps = {
    businessDate: string;
    financialMatrixDate: string;
    kdkmp: KdkmpIdentity | null;
    todayEntry: KdkmpDailyEntry | null;
    computedValues: KdkmpComputedValues;
    financialMatrix: KdkmpFinancialMatrix;
    history: PaginatedResponse<KdkmpDailyEntry>;
};

export type KdkmpMonitoringEntry = KdkmpIdentity & {
    manager: {
        name: string;
        email: string;
        username: string | null;
    } | null;
    metrics: {
        task_completion_rate: number;
    };
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
    regionOptions: KdkmpRegionOption[];
    regionalAccess: KdkmpRegionalAccess;
    consolidation: {
        level: KdkmpConsolidationLevel;
        rows: KdkmpConsolidationRow[];
    };
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
        consolidation_level: KdkmpConsolidationLevel;
    } & KdkmpRegionFilters;
};
