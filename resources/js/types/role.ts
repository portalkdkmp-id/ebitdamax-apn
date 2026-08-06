import type { PaginatedResponse } from '@/types/ebitda';

export type RoleLevel = 'staff' | 'manager' | 'superadmin';

export type RoleDomain = 'apn' | 'kdkmp';

export type RoleItem = {
    id: number;
    uuid: string;
    domain: RoleDomain;
    name: string;
    slug: string;
    level: RoleLevel;
    level_label: string;
    users_count: number;
    created_at: string | null;
    updated_at: string | null;
};

export type RoleOption = {
    value: RoleLevel;
    label: string;
};

export type RoleFilters = {
    domain: RoleDomain;
    search: string;
    sort: string;
    direction: 'asc' | 'desc';
};

export type RolePaginatedResponse = PaginatedResponse<RoleItem>;
