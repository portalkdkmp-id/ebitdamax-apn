export type OrganizationNode = {
    id: number;
    parent_id: number | null;
    parent_name?: string | null;
    code: string;
    name: string;
    slug: string;
    level: string | null;
    node_type: string | null;
    directorate_group: string | null;
    is_revenue_center: boolean;
    is_cost_center: boolean;
    is_active: boolean;
    depth: number;
    path: string | null;
    sort_order: number;
    children?: OrganizationNode[];
};

export type OrganizationSummary = {
    total_nodes: number;
    active_nodes: number;
    revenue_centers: number;
    cost_centers: number;
    max_depth: number;
};

export type OrganizationFilters = {
    search: string;
    status: 'active' | 'inactive' | 'all';
};
