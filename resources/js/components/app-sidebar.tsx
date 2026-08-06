import { Link, usePage } from '@inertiajs/react';
import {
    ChartColumn,
    CircleCheckBig,
    ClipboardList,
    Database,
    FileSpreadsheet,
    FileText,
    FolderCheck,
    FolderKanban,
    Gauge,
    GraduationCap,
    LayoutDashboard,
    MessageSquareText,
    Network,
    Radar,
    ShieldCheck,
    SquareCheckBig,
    UserCog,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as adminKdkmpDashboardIndex } from '@/routes/admin/kdkmp-dashboard';
import { index as ebitdaTreeIndex } from '@/routes/ebitda-tree';
import { index as ebitdaValuesIndex } from '@/routes/ebitda-values';
import { index as importExcelIndex } from '@/routes/import-excel';
import { index as kdkmpDashboardIndex } from '@/routes/kdkmp-dashboard';
import { index as meetingMinutesIndex } from '@/routes/meeting-minutes';
import { index as meetingActionItemsIndex } from '@/routes/meeting-minutes/action-items';
import { index as monitoringIndex } from '@/routes/monitoring';
import { index as organizationsIndex } from '@/routes/organizations';
import { index as rolesIndex } from '@/routes/roles';
import { index as sdmDataIndex } from '@/routes/sdm-data';
import { index as taskCategoriesIndex } from '@/routes/task-categories';
import { completed as taskDashboardCompleted } from '@/routes/task-dashboard';
import { index as taskDashboardIndex } from '@/routes/task-dashboard';
import { index as tasksIndex } from '@/routes/tasks';
import { index as usersIndex } from '@/routes/users';
import { index as valueChainJobdeskIndex } from '@/routes/value-chain-jobdesk';
import type { NavItem } from '@/types';

const superadminApnNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: adminDashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Pohon EBITDA',
        href: ebitdaTreeIndex(),
        icon: ChartColumn,
    },
    {
        title: 'EBITDA Values',
        href: ebitdaValuesIndex(),
        icon: Database,
    },
    {
        title: 'Organizations',
        href: organizationsIndex(),
        icon: Network,
    },
    {
        title: 'Role APN',
        href: rolesIndex({ query: { domain: 'apn' } }),
        icon: ShieldCheck,
    },
    {
        title: 'User APN',
        href: usersIndex({ query: { domain: 'apn' } }),
        icon: UserCog,
    },
    {
        title: 'Value Chain & Jobdesk',
        href: valueChainJobdeskIndex(),
        icon: ClipboardList,
    },
];

const superadminKdkmpNavItems: NavItem[] = [
    {
        title: 'Dashboard KDKMP',
        href: adminKdkmpDashboardIndex(),
        icon: Gauge,
    },
    {
        title: 'Role KDKMP',
        href: rolesIndex({ query: { domain: 'kdkmp' } }),
        icon: ShieldCheck,
    },
    {
        title: 'User KDKMP',
        href: usersIndex({ query: { domain: 'kdkmp' } }),
        icon: UserCog,
    },
    {
        title: 'Data SDM KDKMP',
        href: sdmDataIndex(),
        icon: Users,
    },
];

const apnViewerNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: adminDashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Pohon EBITDA',
        href: ebitdaTreeIndex(),
        icon: ChartColumn,
    },
];

const sharedOperationalNavItems: NavItem[] = [
    {
        title: 'Dashboard Monitoring',
        href: monitoringIndex(),
        icon: Radar,
    },
    {
        title: 'Import Excel',
        href: importExcelIndex(),
        icon: FileSpreadsheet,
    },
];

const meetingMinutesNavItems: NavItem[] = [
    {
        title: 'Minutes of Meeting',
        href: meetingMinutesIndex(),
        icon: FileText,
    },
];

const knowledgeManagementNavItems: NavItem[] = [
    {
        title: 'Chat Lumbung KMS',
        href: '/lumbung-kms/chat',
        icon: MessageSquareText,
    },
];

const meetingActionItemNavItems: NavItem[] = [
    {
        title: 'Action Item MoM',
        href: meetingActionItemsIndex(),
        icon: CircleCheckBig,
    },
];

const superadminWorkReportNavItems: NavItem[] = [
    {
        title: 'Tasks',
        href: tasksIndex(),
        icon: SquareCheckBig,
        items: [
            {
                title: 'Semua Tugas',
                href: tasksIndex(),
                icon: ClipboardList,
            },
            {
                title: 'Tugas sudah selesai',
                href: taskDashboardCompleted(),
                icon: FolderCheck,
            },
            {
                title: 'Kategori Tugas',
                href: taskCategoriesIndex(),
                icon: FolderKanban,
            },
        ],
    },
];

const staffWorkReportNavItems: NavItem[] = [
    {
        title: 'Tasks',
        href: taskDashboardIndex(),
        icon: SquareCheckBig,
        items: [
            {
                title: 'Semua Tugas',
                href: taskDashboardIndex(),
                icon: ClipboardList,
            },
            {
                title: 'Tugas sudah selesai',
                href: taskDashboardCompleted(),
                icon: FolderCheck,
            },
        ],
    },
];

const kdkmpManagerNavItems: NavItem[] = [
    {
        title: 'Dashboard KDKMP',
        href: kdkmpDashboardIndex(),
        icon: Gauge,
    },
    {
        title: 'LMS KDKMP',
        href: 'https://lms.dev-agrinas.id/',
        icon: GraduationCap,
    },
];

const regionalManagerNavItems: NavItem[] = [
    {
        title: 'Dashboard KDKMP',
        href: adminKdkmpDashboardIndex(),
        icon: Gauge,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const isSuperadmin = auth.user?.role?.level === 'superadmin';
    const isKdkmpSuperadmin =
        isSuperadmin && auth.user?.role?.domain === 'kdkmp';
    const isKdkmpManager =
        auth.user?.role?.domain === 'kdkmp' &&
        auth.user.role.slug === 'kepala-toko-manager';
    const isRegionalManager =
        auth.user?.role?.domain === 'kdkmp' &&
        auth.user.role.slug === 'manager-wilayah';
    const isApnUser = auth.user?.role?.domain === 'apn';
    const canViewKdkmpMonitoring =
        auth.user?.can_view_kdkmp_monitoring === true;
    const canAccessMeetingActionItems =
        isSuperadmin || auth.user?.role?.level === 'manager';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {isKdkmpSuperadmin ? (
                    <NavMain
                        items={superadminKdkmpNavItems}
                        label="EBITDAMAX KDKMP"
                    />
                ) : isRegionalManager ? (
                    <NavMain items={regionalManagerNavItems} />
                ) : (
                    <>
                        {isSuperadmin && (
                            <NavMain
                                items={superadminApnNavItems}
                                label="EBITDAMAX APN"
                            />
                        )}
                        {!isSuperadmin && isApnUser && (
                            <NavMain
                                items={apnViewerNavItems}
                                label="EBITDAMAX APN"
                            />
                        )}
                        {isSuperadmin && (
                            <NavMain
                                items={superadminKdkmpNavItems}
                                label="EBITDAMAX KDKMP"
                            />
                        )}
                        {isKdkmpManager && (
                            <NavMain items={kdkmpManagerNavItems} />
                        )}
                        {!isSuperadmin &&
                            !isKdkmpManager &&
                            canViewKdkmpMonitoring && (
                                <NavMain
                                    items={regionalManagerNavItems}
                                    label="EBITDA KDKMP"
                                />
                            )}
                        {isSuperadmin && (
                            <NavMain
                                items={sharedOperationalNavItems}
                                label="Operasional Bersama"
                            />
                        )}
                        <NavMain
                            items={knowledgeManagementNavItems}
                            label="Knowledge Management"
                        />
                        <NavMain
                            items={[
                                ...meetingMinutesNavItems,
                                ...(canAccessMeetingActionItems
                                    ? meetingActionItemNavItems
                                    : []),
                            ]}
                            label="Meeting"
                        />
                        <NavMain
                            items={
                                isSuperadmin
                                    ? superadminWorkReportNavItems
                                    : staffWorkReportNavItems
                            }
                            label="Laporan Pekerjaan"
                        />
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
