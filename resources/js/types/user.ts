import type { PaginatedResponse } from '@/types/ebitda';
import type { RoleDomain, RoleItem } from '@/types/role';

export type UserRole = Pick<
    RoleItem,
    'id' | 'name' | 'slug' | 'level' | 'level_label' | 'domain'
>;

export type UserRegionalAssignment = {
    id: number;
    scope_level: 'province' | 'regency' | 'district';
    provinsi: string;
    kota_kabupaten: string | null;
    kecamatan: string | null;
};

export type ManagerSkDocument = {
    name: string;
    size: number;
    preview_url: string;
};

export type UserRegionOption = {
    provinsi: string;
    kota_kabupaten: string;
    kecamatan: string;
    desa: string;
};

export type UserKdkmpOption = {
    id: number;
    nik: string | null;
    nama_koperasi: string | null;
    provinsi: string | null;
    kota_kabupaten: string | null;
    kecamatan: string | null;
    desa: string | null;
    assigned_manager_user_id: number | null;
};

export type UserItem = {
    id: number;
    role_id: number | null;
    sdm_kdkmp_entry_id: number | null;
    name: string;
    username: string | null;
    email: string;
    email_verified_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    role: UserRole | null;
    regional_assignments: UserRegionalAssignment[];
    kdkmp: UserKdkmpOption | null;
    manager_sk_document: ManagerSkDocument | null;
};

export type UserFilters = {
    domain: RoleDomain;
    search: string;
    role_id: number | null;
    sort: string;
    direction: 'asc' | 'desc';
};

export type UserPaginatedResponse = PaginatedResponse<UserItem>;
