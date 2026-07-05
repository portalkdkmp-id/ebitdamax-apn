export type CalculationItem = {
    id: number;
    organization_id: number;
    year: number;
    scenario: string;

    code: string | null;
    name: string | null;
    level: string | null;
    directorate_group: string | null;
    is_revenue_center: boolean | null;
    is_cost_center: boolean | null;

    source_sheet: string | null;
    classification: string | null;

    man_cost: number;
    method_cost: number;
    material_cost: number;
    machine_cost: number;

    total_cost: number;
    doc_variable: number;
    doc_fixed: number;
    ioc: number;

    raw_payload: Record<string, unknown> | null;
};

export type CalculationSummary = {
    total_rows: number;
    total_man_cost: number;
    total_method_cost: number;
    total_material_cost: number;
    total_machine_cost: number;
    total_cost: number;
    total_doc_variable: number;
    total_doc_fixed: number;
    total_ioc: number;
};

export type CalculationFilters = {
    year: number;
    scenario: string;
    search: string;
    classification: string;
};
