export type UnitCostAssumptionRowType =
    'subtotal' | 'group' | 'item' | 'blank' | 'total';

export type UnitCostAssumptionRow = {
    id: number | null;
    sort_order: number;
    source_page: number;
    row_type: UnitCostAssumptionRowType;
    section_code: string | null;
    category: string | null;
    cost_type: string | null;
    component: string | null;
    plan_quantity: number | null;
    actual_quantity: number | null;
    description: string | null;
    unit: string | null;
    base_price: number | null;
    plan_daily_cost: number | null;
    plan_hourly_cost: number | null;
    actual_daily_cost: number | null;
    actual_hourly_cost: number | null;
    plan_value: number | null;
    actual_value: number | null;
};

export type UnitCostAssumption = {
    id: number | null;
    code: string;
    name: string;
    assumption_date: string | null;
    days_per_year: number | null;
    days_per_month: number | null;
    work_hours_per_day: number | null;
    source_sheet: string;
    rows: UnitCostAssumptionRow[];
};
