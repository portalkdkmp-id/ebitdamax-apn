import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    Clock,
    Download,
    Eye,
    FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { PaginatedResponse } from '@/types/ebitda';
import type { TaskCategoryOption, TaskReportDocument } from '@/types/task';
import type { UserRole } from '@/types/user';

type CompletedTaskReport = {
    id: number;
    uuid: string;
    started_at: string | null;
    finished_at: string | null;
    duration_minutes: number | null;
    status_label: string;
    documents: TaskReportDocument[];
    user: {
        id: number;
        name: string;
        username: string | null;
        email: string;
    } | null;
    task: {
        id: number;
        uuid: string;
        name: string;
        description: string | null;
        time_require: number;
        task_category: TaskCategoryOption;
        roles: UserRole[];
    };
};

type Props = {
    reports: PaginatedResponse<CompletedTaskReport>;
    isSuperadmin: boolean;
};

function formatDateTime(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function paginationLabel(label: string) {
    if (label.includes('Previous')) {
        return 'Sebelumnya';
    }

    if (label.includes('Next')) {
        return 'Berikutnya';
    }

    return label;
}

export default function CompletedTaskDashboard({
    reports,
    isSuperadmin,
}: Props) {
    return (
        <>
            <Head title="Tugas sudah selesai" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                Laporan Pekerjaan
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Tugas sudah selesai
                            </h1>
                            <p className="mt-2 max-w-3xl text-muted-foreground">
                                Riwayat tugas yang sudah diselesaikan oleh user
                                yang sedang login.
                            </p>
                        </div>
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardHeader className="border-b">
                            <CardTitle>Riwayat Tugas Selesai</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="min-w-[260px] p-4">
                                            Nama Task
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Kategori
                                        </TableHead>
                                        <TableHead className="p-4">
                                            PIC Roles
                                        </TableHead>
                                        {isSuperadmin && (
                                            <TableHead className="p-4">
                                                Diselesaikan Oleh
                                            </TableHead>
                                        )}
                                        <TableHead className="p-4">
                                            Mulai
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Selesai
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            Durasi
                                        </TableHead>
                                        <TableHead className="min-w-[220px] p-4">
                                            Dokumen
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={isSuperadmin ? 9 : 8}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Belum ada tugas selesai.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {reports.data.map((report) => (
                                        <TableRow key={report.uuid}>
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <ClipboardList className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {report.task.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {report.task
                                                                .description ??
                                                                '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                {report.task.task_category.name}
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {report.task.roles.map(
                                                        (role) => (
                                                            <Badge
                                                                key={role.id}
                                                            >
                                                                {role.name}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </TableCell>
                                            {isSuperadmin && (
                                                <TableCell className="p-4">
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {report.user
                                                                ?.name ?? '-'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {report.user
                                                                ?.username ??
                                                                report.user
                                                                    ?.email ??
                                                                '-'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell className="p-4">
                                                {formatDateTime(
                                                    report.started_at,
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4">
                                                {formatDateTime(
                                                    report.finished_at,
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4 text-right">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="size-4 text-muted-foreground" />
                                                    {report.duration_minutes ??
                                                        0}{' '}
                                                    menit
                                                </span>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                {report.documents.length ===
                                                0 ? (
                                                    <span className="text-sm text-muted-foreground">
                                                        -
                                                    </span>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {report.documents.map(
                                                            (
                                                                document,
                                                                index,
                                                            ) => (
                                                                <div
                                                                    key={`${document.phase}-${document.name}-${index}`}
                                                                    className="flex items-center justify-between gap-2 rounded-md border p-2"
                                                                >
                                                                    <div className="flex min-w-0 items-center gap-2">
                                                                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                                                                        <div className="min-w-0">
                                                                            <p className="max-w-32 truncate text-xs font-medium">
                                                                                {
                                                                                    document.name
                                                                                }
                                                                            </p>
                                                                            <p className="text-[11px] text-muted-foreground">
                                                                                {
                                                                                    document.phase_label
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex shrink-0">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={
                                                                                    document.preview_url
                                                                                }
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                aria-label={`Preview ${document.name}`}
                                                                            >
                                                                                <Eye className="size-4" />
                                                                            </a>
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={
                                                                                    document.download_url
                                                                                }
                                                                                aria-label={`Download ${document.name}`}
                                                                            >
                                                                                <Download className="size-4" />
                                                                            </a>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <Badge>
                                                    <CheckCircle2 className="size-3" />
                                                    {report.status_label}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {reports.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {reports.from ?? 0}-
                                {reports.to ?? 0} dari {reports.total} laporan
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {reports.links.map((link) => (
                                    <Button
                                        key={`${link.label}-${link.url}`}
                                        asChild={Boolean(link.url)}
                                        type="button"
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                    >
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                preserveScroll
                                            >
                                                {paginationLabel(link.label)}
                                            </Link>
                                        ) : (
                                            <span>
                                                {paginationLabel(link.label)}
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
