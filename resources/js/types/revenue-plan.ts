export type RevenuePlanRowType = 'item' | 'blank';

export type RevenuePlanRow = {
    id: number | null;
    sort_order: number;
    row_type: RevenuePlanRowType;
    display_number: number | null;
    revenue_service: string | null;
    planned_volume: number | null;
    unit: string | null;
    rate: number | null;
    planned_revenue: number | null;
};

export type RevenuePlan = {
    id: number | null;
    code: string;
    name: string;
    plan_date: string | null;
    rka_revenue_target: number | null;
    planned_production_quantity: number | null;
    days_per_month: number | null;
    daily_rka_revenue_target: number | null;
    planned_total_daily_revenue: number | null;
    source_sheet: string;
    rows: RevenuePlanRow[];
};
