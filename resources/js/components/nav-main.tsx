import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

function isExternalNavItem(item: NavItem): boolean {
    return /^https?:\/\//i.test(toUrl(item.href));
}

function NavItemContent({ item }: { item: NavItem }) {
    return (
        <>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
        </>
    );
}

export function NavMain({
    items = [],
    label = 'Navigasi',
}: {
    items: NavItem[];
    label?: string;
}) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

    const isItemActive = (item: NavItem) => {
        if (isExternalNavItem(item)) {
            return false;
        }

        return (
            isCurrentUrl(item.href) ||
            (item.items?.some(
                (child) =>
                    !isExternalNavItem(child) &&
                    isCurrentOrParentUrl(child.href),
            ) ??
                false)
        );
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isItemActive(item)}
                            tooltip={{ children: item.title }}
                        >
                            {isExternalNavItem(item) ? (
                                <a
                                    href={toUrl(item.href)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <NavItemContent item={item} />
                                </a>
                            ) : (
                                <Link href={item.href} prefetch>
                                    <NavItemContent item={item} />
                                </Link>
                            )}
                        </SidebarMenuButton>
                        {item.items && item.items.length > 0 && (
                            <SidebarMenuSub>
                                {item.items.map((child) => (
                                    <SidebarMenuSubItem key={child.title}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={
                                                !isExternalNavItem(child) &&
                                                isCurrentUrl(child.href)
                                            }
                                        >
                                            {isExternalNavItem(child) ? (
                                                <a
                                                    href={toUrl(child.href)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <NavItemContent
                                                        item={child}
                                                    />
                                                </a>
                                            ) : (
                                                <Link
                                                    href={child.href}
                                                    prefetch
                                                >
                                                    <NavItemContent
                                                        item={child}
                                                    />
                                                </Link>
                                            )}
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
