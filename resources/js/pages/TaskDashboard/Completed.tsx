import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    Clock,
    Download,
    Eye,
    FileText,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    const [selectedReport, setSelectedReport] =
        useState<CompletedTaskReport | null>(null);

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
                                            Status
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={isSuperadmin ? 6 : 5}
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
                                                <Badge>
                                                    <CheckCircle2 className="size-3" />
                                                    {report.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelectedReport(
                                                            report,
                                                        )
                                                    }
                                                >
                                                    Detail
                                                </Button>
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

            <Dialog
                open={selectedReport !== null}
                onOpenChange={(open) => !open && setSelectedReport(null)}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detail Laporan Tugas</DialogTitle>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    {selectedReport.task.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {selectedReport.task.description ??
                                        'Tidak ada deskripsi.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Waktu Mulai
                                    </p>
                                    <p className="font-medium">
                                        {formatDateTime(
                                            selectedReport.started_at,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Waktu Selesai
                                    </p>
                                    <p className="font-medium">
                                        {formatDateTime(
                                            selectedReport.finished_at,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Durasi
                                    </p>
                                    <p className="inline-flex items-center gap-1 font-medium">
                                        <Clock className="size-4 text-muted-foreground" />
                                        {selectedReport.duration_minutes ??
                                            0}{' '}
                                        menit
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Status
                                    </p>
                                    <Badge className="mt-1">
                                        {selectedReport.status_label}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-3 text-sm font-semibold">
                                    Dokumen & Foto Terlampir
                                </h4>
                                {selectedReport.documents.length === 0 ? (
                                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                        Tidak ada dokumen atau foto yang
                                        dilampirkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedReport.documents.map(
                                            (document, index) => (
                                                <div
                                                    key={`${document.phase}-${document.name}-${index}`}
                                                    className="flex items-center justify-between gap-3 rounded-md border bg-card p-3 shadow-sm"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                                            <FileText className="size-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {document.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Fase:{' '}
                                                                {
                                                                    document.phase_label
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    document.preview_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                aria-label={`Preview ${document.name}`}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <Eye className="size-3.5" />
                                                                <span className="hidden sm:inline">
                                                                    Preview
                                                                </span>
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    document.download_url
                                                                }
                                                                aria-label={`Download ${document.name}`}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <Download className="size-3.5" />
                                                                <span className="hidden sm:inline">
                                                                    Unduh
                                                                </span>
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
