import { Head, useForm } from '@inertiajs/react';
import { Megaphone, Send, UsersRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as announcementsIndex, store } from '@/routes/announcements';
import type { AnnouncementRole } from '@/types/announcement';

type Props = {
    roles: AnnouncementRole[];
};

type AnnouncementFormData = {
    title: string;
    message: string;
    role_ids: number[];
};

const defaultFormData: AnnouncementFormData = {
    title: '',
    message: '',
    role_ids: [],
};

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}

export default function AnnouncementsIndex({ roles }: Props) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<AnnouncementFormData>(defaultFormData);
    const selectedRoles = useMemo(
        () => roles.filter((role) => data.role_ids.includes(role.id)),
        [data.role_ids, roles],
    );
    const selectedUserCount = selectedRoles.reduce(
        (total, role) => total + role.user_count,
        0,
    );
    const hasSelectedAllRoles =
        roles.length > 0 && data.role_ids.length === roles.length;

    const toggleRole = (roleId: number) => {
        setData(
            'role_ids',
            data.role_ids.includes(roleId)
                ? data.role_ids.filter((id) => id !== roleId)
                : [...data.role_ids, roleId],
        );
    };

    const toggleAllRoles = () => {
        setData(
            'role_ids',
            hasSelectedAllRoles ? [] : roles.map((role) => role.id),
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
            },
        });
    };

    return (
        <>
            <Head title="Pengumuman" />

            <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-4xl space-y-6">
                    <section className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-primary/10 p-3 text-primary">
                                <Megaphone className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-primary uppercase">
                                    Komunikasi Internal
                                </p>
                                <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                    Buat Pengumuman
                                </h1>
                                <p className="mt-2 max-w-2xl text-muted-foreground">
                                    Kirim pengumuman kepada seluruh user yang
                                    memiliki role penerima yang dipilih.
                                </p>
                            </div>
                        </div>
                    </section>

                    <form onSubmit={submit} className="space-y-6">
                        <Card className="rounded-lg border bg-card shadow-sm">
                            <CardHeader>
                                <CardTitle>Isi Pengumuman</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="announcement-title">
                                        Judul
                                    </Label>
                                    <Input
                                        id="announcement-title"
                                        value={data.title}
                                        onChange={(event) =>
                                            setData('title', event.target.value)
                                        }
                                        maxLength={255}
                                        aria-invalid={Boolean(errors.title)}
                                        placeholder="Contoh: Perubahan jadwal rapat mingguan"
                                    />
                                    <div className="flex justify-between gap-4">
                                        <FieldError message={errors.title} />
                                        <p className="ml-auto text-xs text-muted-foreground">
                                            {data.title.length}/255
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="announcement-message">
                                        Pesan
                                    </Label>
                                    <textarea
                                        id="announcement-message"
                                        value={data.message}
                                        onChange={(event) =>
                                            setData(
                                                'message',
                                                event.target.value,
                                            )
                                        }
                                        rows={7}
                                        maxLength={5000}
                                        aria-invalid={Boolean(errors.message)}
                                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                        placeholder="Tulis informasi yang ingin disampaikan kepada penerima..."
                                    />
                                    <div className="flex justify-between gap-4">
                                        <FieldError message={errors.message} />
                                        <p className="ml-auto text-xs text-muted-foreground">
                                            {data.message.length}/5000
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border bg-card shadow-sm">
                            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle>Role Penerima</CardTitle>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Pilih role yang akan menerima pengumuman
                                        ini.
                                    </p>
                                </div>
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                                    <Checkbox
                                        checked={hasSelectedAllRoles}
                                        onCheckedChange={toggleAllRoles}
                                    />
                                    Pilih semua
                                </label>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {roles.map((role) => (
                                        <label
                                            key={role.id}
                                            htmlFor={`announcement-role-${role.id}`}
                                            className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                                        >
                                            <Checkbox
                                                id={`announcement-role-${role.id}`}
                                                checked={data.role_ids.includes(
                                                    role.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleRole(role.id)
                                                }
                                            />
                                            <span className="min-w-0 flex-1 space-y-1">
                                                <span className="flex flex-wrap items-center gap-2">
                                                    <span className="font-medium text-foreground">
                                                        {role.name}
                                                    </span>
                                                    <Badge variant="outline">
                                                        {role.domain === 'kdkmp'
                                                            ? 'KDKMP'
                                                            : 'APN'}
                                                    </Badge>
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {role.level_label} ·{' '}
                                                    {role.user_count} user
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <FieldError message={errors.role_ids} />

                                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
                                    <UsersRound className="size-4 text-muted-foreground" />
                                    <span>
                                        {selectedRoles.length} role dipilih
                                    </span>
                                    <span className="text-muted-foreground">
                                        ·
                                    </span>
                                    <span className="font-medium">
                                        {selectedUserCount} user akan menerima
                                        notifikasi
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                <Send className="size-4" />
                                {processing
                                    ? 'Mengirim...'
                                    : 'Kirim Pengumuman'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}

AnnouncementsIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Pengumuman',
            href: announcementsIndex(),
        },
    ],
};
