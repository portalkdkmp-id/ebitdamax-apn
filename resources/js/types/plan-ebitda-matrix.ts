export type PlanEbitdaMatrixProcess = {
    id: number | null;
    sequence: number;
    process_group: string;
    detail_process: string;
    unit_name: string | null;
    pic: string;
};

export type PlanEbitdaMatrixRowType = 'detail' | 'summary' | 'single';

export type PlanEbitdaMatrixRow = {
    id: number | null;
    section_code: string;
    sort_order: number;
    row_type: PlanEbitdaMatrixRowType;
    label: string;
    values: Array<string | null>;
    total: string | null;
    notes: string | null;
    notes_tone: 'yellow' | 'blue' | null;
    is_calculated: boolean;
    source_page: number;
};

export type PlanEbitdaMatrix = {
    id: number | null;
    code: string;
    name: string;
    source_sheet: string;
    processes: PlanEbitdaMatrixProcess[];
    rows: PlanEbitdaMatrixRow[];
};

export type PlanEbitdaMatrixDependencies = {
    businessProcess: boolean;
    unitCostAssumption: boolean;
    revenuePlan: boolean;
    complete: boolean;
};
