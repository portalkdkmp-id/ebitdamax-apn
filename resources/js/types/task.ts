import type { PaginatedResponse } from '@/types/ebitda';
import type { UserRole } from '@/types/user';

export type TaskCategoryOption = {
    id: number;
    name: string;
    slug: string;
};

export type TaskSelectOption = {
    value: string;
    label: string;
};

export type TaskAdditionalFieldInputType =
    | 'text'
    | 'textarea'
    | 'integer'
    | 'decimal'
    | 'number'
    | 'date'
    | 'datetime'
    | 'time'
    | 'boolean'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'file';

export type TaskAdditionalFieldShowWhen = 'start' | 'finish';
export type TaskPeriod = 'once' | 'daily' | 'weekly' | 'monthly';
export type TaskBmcStatus =
    | 'belum_dipetakan'
    | 'key_partnerships'
    | 'key_activities'
    | 'key_resources'
    | 'value_propositions'
    | 'customer_relationships'
    | 'channels'
    | 'customer_segments'
    | 'cost_structure'
    | 'revenue_streams';

export type TaskReportDocument = {
    phase: 'start' | 'finish';
    phase_label: string;
    name: string;
    mime_type: string | null;
    size: number;
    preview_url: string;
    download_url: string;
};

export type TaskReportPhoto = {
    phase: 'start' | 'finish';
    phase_label: string;
    name: string;
    preview_url: string;
    download_url: string;
};

export type TaskReportValue = {
    phase: 'start' | 'finish';
    phase_label: string;
    label: string;
    value: string | null;
    file: TaskReportDocument | null;
};

export type TaskAdditionalFieldItem = {
    id?: number;
    uuid?: string;
    label: string;
    field_name?: string;
    input_type: TaskAdditionalFieldInputType;
    input_type_label?: string;
    show_when: TaskAdditionalFieldShowWhen;
    show_when_label?: string;
    is_required: boolean;
    sort_order?: number;
    options: string[];
};

export type TaskItem = {
    id: number;
    uuid: string;
    task_category_id: number;
    bmc_status: TaskBmcStatus;
    bmc_status_label: string;
    role_id: number | null;
    role_ids: number[];
    sort_order: number | null;
    name: string;
    description: string | null;
    execution_time: string | null;
    time_require: number;
    lower_time_threshold_minutes: number | null;
    upper_time_threshold_minutes: number | null;
    period: TaskPeriod;
    period_label: string;
    is_active: boolean;
    task_category: TaskCategoryOption;
    role: UserRole | null;
    roles: UserRole[];
    additional_fields: TaskAdditionalFieldItem[];
    created_at: string | null;
    updated_at: string | null;
};

export type TaskFilters = {
    search: string;
    task_category_id: number | null;
    role_id: number | null;
    status: 'active' | 'inactive' | 'all';
    sort: string;
    direction: 'asc' | 'desc';
};

export type TaskPaginatedResponse = PaginatedResponse<TaskItem>;
