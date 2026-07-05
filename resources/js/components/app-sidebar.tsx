import { Link } from '@inertiajs/react';
import {
    Calculator,
    ChartColumn,
    ClipboardList,
    FileSpreadsheet,
    LayoutDashboard,
    Network,
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
import { index as importExcelIndex } from '@/routes/import-excel';
import { index as organizationsIndex } from '@/routes/organizations';
import { index as valueChainJobdeskIndex } from '@/routes/value-chain-jobdesk';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Organisasi',
        href: organizationsIndex(),
        icon: Network,
    },
    {
        title: 'Pohon EBITDA',
        href: ebitdaTreeIndex(),
        icon: ChartColumn,
    },
    {
        title: 'Value Chain & Jobdesc',
        href: valueChainJobdeskIndex(),
        icon: ClipboardList,
    },
    {
        title: 'Kalkulasi',
        href: calculationsIndex(),
        icon: Calculator,
    },
    {
        title: 'Import Excel',
        href: importExcelIndex(),
        icon: FileSpreadsheet,
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
