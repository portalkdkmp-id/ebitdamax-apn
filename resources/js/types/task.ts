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
    | 'checkbox';

export type TaskAdditionalFieldShowWhen = 'start' | 'finish';

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
    role_id: number;
    name: string;
    description: string | null;
    time_require: number;
    is_active: boolean;
    task_category: TaskCategoryOption;
    role: UserRole;
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
