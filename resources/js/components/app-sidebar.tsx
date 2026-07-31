import { Link, usePage } from '@inertiajs/react';
import {
    Calculator,
    ChartColumn,
    CircleCheckBig,
    ClipboardList,
    Coins,
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
    TableProperties,
    TrendingUp,
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
import { index as kdkmpGeraiBusinessProcessIndex } from '@/routes/business-processes/kdkmp-gerai';
import { index as calculationsIndex } from '@/routes/calculations';
import { index as ebitdaTreeIndex } from '@/routes/ebitda-tree';
import { index as ebitdaValuesIndex } from '@/routes/ebitda-values';
import { index as importExcelIndex } from '@/routes/import-excel';
import { index as kdkmpDashboardIndex } from '@/routes/kdkmp-dashboard';
import { index as lmsKdkmpIndex } from '@/routes/lms-kdkmp';
import { index as meetingMinutesIndex } from '@/routes/meeting-minutes';
import { index as meetingActionItemsIndex } from '@/routes/meeting-minutes/action-items';
import { index as monitoringIndex } from '@/routes/monitoring';
import { index as organizationsIndex } from '@/routes/organizations';
import { index as kdkmpGeraiPlanEbitdaMatrixIndex } from '@/routes/plan-ebitda-matrices/kdkmp-gerai';
import { index as kdkmpGeraiRevenuePlanIndex } from '@/routes/revenue-plans/kdkmp-gerai';
import { index as rolesIndex } from '@/routes/roles';
import { index as sdmDataIndex } from '@/routes/sdm-data';
import { index as taskCategoriesIndex } from '@/routes/task-categories';
import { completed as taskDashboardCompleted } from '@/routes/task-dashboard';
import { index as taskDashboardIndex } from '@/routes/task-dashboard';
import { index as tasksIndex } from '@/routes/tasks';
import { index as kdkmpGeraiUnitCostAssumptionIndex } from '@/routes/unit-cost-assumptions/kdkmp-gerai';
import { index as usersIndex } from '@/routes/users';
import { index as valueChainJobdeskIndex } from '@/routes/value-chain-jobdesk';
import type { NavItem } from '@/types';

const superadminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: adminDashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Dashboard Monitoring',
        href: monitoringIndex(),
        icon: Radar,
    },
    {
        title: 'Dashboard KDKMP',
        href: adminKdkmpDashboardIndex(),
        icon: Gauge,
    },
    {
        title: 'Data SDM',
        href: sdmDataIndex(),
        icon: Users,
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
        title: 'Kalkulasi',
        href: calculationsIndex(),
        icon: Calculator,
    },
    {
        title: 'Organizations',
        href: organizationsIndex(),
        icon: Network,
    },
    {
        title: 'Roles',
        href: rolesIndex(),
        icon: ShieldCheck,
    },
    {
        title: 'Users',
        href: usersIndex(),
        icon: UserCog,
    },
    {
        title: 'Value Chain & Jobdesk',
        href: valueChainJobdeskIndex(),
        icon: ClipboardList,
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

const kdkmpBusinessProcessNavItems: NavItem[] = [
    {
        title: 'Business Process',
        href: kdkmpGeraiBusinessProcessIndex(),
        icon: TableProperties,
    },
    {
        title: 'Unit Cost Assumption',
        href: kdkmpGeraiUnitCostAssumptionIndex(),
        icon: Coins,
    },
    {
        title: 'Rencana Pendapatan',
        href: kdkmpGeraiRevenuePlanIndex(),
        icon: TrendingUp,
    },
    {
        title: 'Plan EBITDA Matrix',
        href: kdkmpGeraiPlanEbitdaMatrixIndex(),
        icon: ChartColumn,
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
        href: lmsKdkmpIndex(),
        icon: GraduationCap,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const isSuperadmin = auth.user?.role?.level === 'superadmin';
    const isEbitdaKdkmp = auth.user?.role?.slug === 'ebitda_kdkmp';
    const isKdkmpManager = auth.user?.role?.slug === 'kepala-toko-manager';
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
                {isSuperadmin && <NavMain items={superadminNavItems} />}
                {isKdkmpManager && <NavMain items={kdkmpManagerNavItems} />}
                {(isSuperadmin || isEbitdaKdkmp) && (
                    <NavMain
                        items={kdkmpBusinessProcessNavItems}
                        label="EBITDA KDKMP"
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
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
