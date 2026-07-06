import type {
    EbitdaCostAlertComponent,
    EbitdaTreeNode,
    EbitdaValue,
} from './ebitda-tree';

export type DirectorateDashboardItem = {
    id: number;
    slug: string;
    code: string;
    name: string;
    level: string | null;
    is_revenue_center: boolean;
    is_cost_center: boolean;
    value_source: 'excel' | 'calculated_from_children' | 'empty';
    value: EbitdaValue;
};

export type ChartItem = {
    code?: string;
    name: string;
    label: string;
    value: number;
};

export type CostOverrunAlert = {
    organization_id: number;
    code: string | null;
    name: string | null;
    level: string | null;
    revenue: number;
    doc_variable: number;
    doc_fixed: number;
    ioc: number;
    toc: number;
    ebitda: number;
    ebitda_margin: number | null;
    overrun_components: EbitdaCostAlertComponent[];
    benchmark_toc: number;
    benchmark_label: string;
    largest_component: 'doc_variable' | 'doc_fixed' | 'ioc' | null;
    largest_component_label: string | null;
    largest_cost_value: number;
    overrun_amount: number;
    overrun_ratio: number | null;
    severity: 'none' | 'warning' | 'danger';
    analysis: string;
};

export type DashboardCharts = {
    revenue_by_directorate: ChartItem[];
    cost_breakdown: ChartItem[];
    ebitda_by_directorate: ChartItem[];
    margin_ranking: ChartItem[];
};

export type DashboardAlerts = {
    negative_ebitda: CostOverrunAlert[];
};

export type ExecutiveDashboardProps = {
    year: number;
    scenario: string;
    summary: EbitdaValue;
    directorates: DirectorateDashboardItem[];
    tree: EbitdaTreeNode | null;
    charts: DashboardCharts;
    alerts: DashboardAlerts;
};

export type DirectorateDashboardProps = {
    year: number;
    scenario: string;
    directorate: {
        id: number;
        slug: string;
        code: string;
        name: string;
    };
    summary: EbitdaValue;
    tree: EbitdaTreeNode;
    charts: DashboardCharts;
    alerts: DashboardAlerts;
};
