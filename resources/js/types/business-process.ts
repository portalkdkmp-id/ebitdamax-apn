export type BusinessProcessStep = {
    id: number | null;
    sequence: number;
    process_group: string;
    detail_process: string;
    pic: string;
    standard_time_minutes: number;
    output_target: string | null;
    responsibility_value: number | null;
};

export type BusinessProcess = {
    id: number | null;
    code: string;
    name: string;
    unit_name: string | null;
    unit_code: string | null;
    steps: BusinessProcessStep[];
};
