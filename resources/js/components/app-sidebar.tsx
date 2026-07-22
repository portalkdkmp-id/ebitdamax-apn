import { Link } from '@inertiajs/react';
import {
    Calculator,
    ChartColumn,
    ClipboardList,
    Database,
    FileSpreadsheet,
    FileText,
    LayoutDashboard,
    Network,
    Radar,
    ShieldCheck,
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
import { index as calculationsIndex } from '@/routes/calculations';
import { index as ebitdaTreeIndex } from '@/routes/ebitda-tree';
import { index as ebitdaValuesIndex } from '@/routes/ebitda-values';
import { index as importExcelIndex } from '@/routes/import-excel';
import { index as meetingMinutesIndex } from '@/routes/meeting-minutes';
import { index as monitoringIndex } from '@/routes/monitoring';
import { index as organizationsIndex } from '@/routes/organizations';
import { index as rolesIndex } from '@/routes/roles';
import { index as sdmDataIndex } from '@/routes/sdm-data';
import { index as valueChainJobdeskIndex } from '@/routes/value-chain-jobdesk';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Dashboard Monitoring',
        href: monitoringIndex(),
        icon: Radar,
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
        title: 'Value Chain & Jobdesk',
        href: valueChainJobdeskIndex(),
        icon: ClipboardList,
    },
    {
        title: 'Import Excel',
        href: importExcelIndex(),
        icon: FileSpreadsheet,
    },
    {
        title: 'Minutes of Meeting',
        href: meetingMinutesIndex(),
        icon: FileText,
    },
];

export function AppSidebar() {
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
