export type AnnouncementRole = {
    id: number;
    name: string;
    level: 'staff' | 'manager' | 'superadmin';
    level_label: string;
    domain: 'apn' | 'kdkmp';
    user_count: number;
};
