import { Head, router } from '@inertiajs/react';
import { Bell, CheckCheck, Megaphone } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    index as notificationsIndex,
    read,
    readAll,
} from '@/routes/notifications';
import type { UserNotification } from '@/types/notification';

type Props = {
    notifications: UserNotification[];
};

function formatNotificationDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function NotificationsIndex({ notifications }: Props) {
    const [processingNotificationId, setProcessingNotificationId] = useState<
        string | null
    >(null);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const unreadCount = notifications.filter(
        (notification) => notification.read_at === null,
    ).length;

    const markNotificationAsRead = (notificationId: string) => {
        setProcessingNotificationId(notificationId);

        router.patch(
            read.url(notificationId),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingNotificationId(null),
            },
        );
    };

    const markAllNotificationsAsRead = () => {
        setIsMarkingAll(true);

        router.patch(
            readAll.url(),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsMarkingAll(false),
            },
        );
    };

    return (
        <>
            <Head title="Notifikasi" />

            <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-4xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-primary/10 p-3 text-primary">
                                <Bell className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-primary uppercase">
                                    Notifikasi
                                </p>
                                <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                    Pengumuman untuk Anda
                                </h1>
                                <p className="mt-2 text-muted-foreground">
                                    {unreadCount > 0
                                        ? `${unreadCount} notifikasi belum dibaca.`
                                        : 'Semua notifikasi sudah dibaca.'}
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={unreadCount === 0 || isMarkingAll}
                            onClick={markAllNotificationsAsRead}
                        >
                            <CheckCheck className="size-4" />
                            {isMarkingAll
                                ? 'Memproses...'
                                : 'Tandai semua dibaca'}
                        </Button>
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle>Riwayat Pengumuman</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {notifications.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                                    Belum ada pengumuman yang diterima.
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <article
                                        key={notification.id}
                                        className="rounded-lg border p-4 transition-colors"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 gap-3">
                                                <div className="rounded-md bg-primary/10 p-2 text-primary">
                                                    <Megaphone className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h2 className="font-semibold text-foreground">
                                                            {notification.title}
                                                        </h2>
                                                        {!notification.read_at && (
                                                            <Badge>Baru</Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                                                        {notification.message}
                                                    </p>
                                                    <p className="mt-3 text-xs text-muted-foreground">
                                                        {notification.sender_name
                                                            ? `Dikirim oleh ${notification.sender_name} · `
                                                            : ''}
                                                        {formatNotificationDate(
                                                            notification.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            {!notification.read_at && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                        processingNotificationId ===
                                                        notification.id
                                                    }
                                                    onClick={() =>
                                                        markNotificationAsRead(
                                                            notification.id,
                                                        )
                                                    }
                                                >
                                                    <CheckCheck className="size-4" />
                                                    {processingNotificationId ===
                                                    notification.id
                                                        ? 'Memproses...'
                                                        : 'Tandai dibaca'}
                                                </Button>
                                            )}
                                        </div>
                                    </article>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}

NotificationsIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Notifikasi',
            href: notificationsIndex(),
        },
    ],
};
