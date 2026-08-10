import { Link, router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    index as notificationsIndex,
    read,
    readAll,
} from '@/routes/notifications';
import type { UserNotification } from '@/types/notification';

function formatNotificationDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function NotificationBell() {
    const { notificationCenter } = usePage().props;
    const unreadCount = notificationCenter.unread_count;

    const markNotificationAsRead = (notification: UserNotification) => {
        if (notification.read_at) {
            return;
        }

        router.patch(
            read.url(notification.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const markAllNotificationsAsRead = () => {
        if (unreadCount === 0) {
            return;
        }

        router.patch(
            readAll.url(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Buka notifikasi"
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-destructive px-1 text-center text-[10px] leading-5 font-semibold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[min(24rem,calc(100vw-2rem))] p-2"
            >
                <DropdownMenuLabel className="flex items-center justify-between gap-3 px-2 py-2">
                    <span>Notifikasi</span>
                    {unreadCount > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                            {unreadCount} belum dibaca
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notificationCenter.items.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                        Belum ada pengumuman.
                    </p>
                ) : (
                    <div className="max-h-96 space-y-1 overflow-y-auto">
                        {notificationCenter.items.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="items-start gap-3 whitespace-normal"
                                onSelect={(event) => {
                                    event.preventDefault();
                                    markNotificationAsRead(notification);
                                }}
                            >
                                <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium">
                                            {notification.title}
                                        </p>
                                        {!notification.read_at && (
                                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatNotificationDate(
                                            notification.created_at,
                                        )}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}

                <DropdownMenuSeparator />
                <div className="flex items-center justify-between gap-2 px-1 pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={unreadCount === 0}
                        onClick={markAllNotificationsAsRead}
                    >
                        <CheckCheck className="size-4" />
                        Tandai dibaca
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={notificationsIndex()}>Lihat semua</Link>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
