export type EbitdaValue = {
    revenue: number;
    doc_variable: number;
    doc_fixed: number;
    ioc: number;
    toc: number;
    ebitda: number;
    ebitda_margin: number | null;
};

export type EbitdaCostAlertComponent = {
    key: 'doc_variable' | 'doc_fixed' | 'ioc';
    label: string;
    value: number;
    benchmark_toc: number;
    overrun_amount: number;
    overrun_ratio: number | null;
};

export type EbitdaCostAlert = {
    has_overrun: boolean;
    severity: 'none' | 'warning' | 'danger';
    benchmark_toc: number;
    benchmark_label: string;
    components: EbitdaCostAlertComponent[];
    largest_component: 'doc_variable' | 'doc_fixed' | 'ioc' | null;
    largest_component_label: string | null;
    largest_cost_value: number;
    overrun_amount: number;
    overrun_ratio: number | null;
    message: string;
};

export type EbitdaTreeNode = {
    id: number;
    slug: string;
    code: string;
    name: string;
    level: string | null;
    node_type: string | null;
    directorate_group: string | null;
    is_revenue_center: boolean;
    is_cost_center: boolean;
    depth: number;
    value_source: 'excel' | 'calculated_from_children' | 'empty';
    value: EbitdaValue;
    cost_alert: EbitdaCostAlert;
    children: EbitdaTreeNode[];
};

export type EbitdaTreeOption = {
    id: number;
    slug: string;
    code: string;
    name: string;
    level: string | null;
};
