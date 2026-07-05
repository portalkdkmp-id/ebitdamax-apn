export type OrganizationNode = {
  id: number;
  parent_id: number | null;
  code: string;
  name: string;
  level: string | null;
  node_type: string | null;
  directorate_group: string | null;
  is_revenue_center: boolean;
  is_cost_center: boolean;
  depth: number;
  path: string | null;
  children?: OrganizationNode[];
};

export type OrganizationSummary = {
  total_nodes: number;
  revenue_centers: number;
  cost_centers: number;
  max_depth: number;
};
