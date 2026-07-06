export type EbitdaValue = {
    revenue: number;
    doc_variable: number;
    doc_fixed: number;
    ioc: number;
    toc: number;
    ebitda: number;
    ebitda_margin: number | null;
};

export type EbitdaValueItem = EbitdaValue & {
    id: number;
    organization_id: number;
    period_date: string | null;
    year: number;
    scenario: string;
    source_sheet: string | null;
    value_source: 'excel' | 'calculated_from_children' | 'empty';
    resolved_value: EbitdaValue;
    classification: string | null;
    man_cost: number;
    method_cost: number;
    material_cost: number;
    machine_cost: number;
    organization: {
        id: number;
        code: string;
        name: string;
        level: string | null;
        is_revenue_center: boolean;
        is_cost_center: boolean;
    } | null;
};

export type EbitdaValueFilters = {
    search: string;
    year: number;
    scenario: string;
};

export type OrganizationOption = {
    id: number;
    code: string;
    name: string;
    level: string | null;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedResponse<T> = {
    data: T[];
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    per_page: number;
    to: number | null;
    total: number;
};

export type DirectorateDashboardItem = {
    id: number;
    slug: string;
    code: string;
    name: string;
    level: string | null;
    is_revenue_center: boolean;
    is_cost_center: boolean;
    value: EbitdaValue;
};

export type EbitdaTreeNode = {
    id: number;
    slug: string;
    code: string;
    name: string;
    level: string | null;
    is_revenue_center: boolean;
    is_cost_center: boolean;
    value: EbitdaValue;
    children: EbitdaTreeNode[];
};
