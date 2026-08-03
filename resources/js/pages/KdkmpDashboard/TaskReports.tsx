import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    Clock,
    Download,
    Eye,
    FileText,
    ImageIcon,
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
import { index as monitoringIndex } from '@/routes/admin/kdkmp-dashboard';
import type {
    TaskCategoryOption,
    TaskReportDocument,
    TaskReportPhoto,
    TaskReportValue,
} from '@/types/task';
import type { UserRole } from '@/types/user';

type CompletedTaskReport = {
    id: number;
    uuid: string;
    started_at: string | null;
    finished_at: string | null;
    duration_minutes: number | null;
    status_label: string;
    photos: TaskReportPhoto[];
    documents: TaskReportDocument[];
    values: TaskReportValue[];
    task: {
        id: number;
        uuid: string;
        name: string;
        description: string | null;
        time_require: number;
        lower_time_threshold_minutes: number | null;
        upper_time_threshold_minutes: number | null;
        task_category: TaskCategoryOption;
        roles: UserRole[];
    };
};

type Props = {
    kdkmpEntry: {
        id: number;
        name: string;
        manager: {
            name: string;
            email: string;
        } | null;
    };
    date: string;
    reports: CompletedTaskReport[];
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

function formatDateDisplay(value: string) {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function formatDuration(minutes: number | null) {
    const totalMinutes = minutes ?? 0;

    if (totalMinutes < 60) {
        return `${totalMinutes} menit`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return remainingMinutes > 0
        ? `${hours} jam ${remainingMinutes} menit`
        : `${hours} jam`;
}

function formatFileSize(size: number) {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatReportValue(value: string | null) {
    if (value === null || value === '') {
        return '-';
    }

    try {
        const parsedValue: unknown = JSON.parse(value);

        if (Array.isArray(parsedValue)) {
            return parsedValue.join(', ') || '-';
        }
    } catch {
        return value;
    }

    return value;
}

function formatTimeThreshold(
    lowerThreshold: number | null,
    upperThreshold: number | null,
) {
    if (lowerThreshold === null && upperThreshold === null) {
        return 'Belum ditentukan';
    }

    if (lowerThreshold === null) {
        return `Maks. ${upperThreshold} menit`;
    }

    if (upperThreshold === null) {
        return `Min. ${lowerThreshold} menit`;
    }

    return `${lowerThreshold}–${upperThreshold} menit`;
}

export default function KdkmpDashboardTaskReports({
    kdkmpEntry,
    date,
    reports,
}: Props) {
    const [selectedReport, setSelectedReport] =
        useState<CompletedTaskReport | null>(null);

    return (
        <>
            <Head title={`Task Reports KDKMP - ${kdkmpEntry.name}`} />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="mr-2"
                                >
                                    <Link
                                        href={monitoringIndex.url({
                                            query: { date },
                                        })}
                                    >
                                        <ArrowLeft className="size-4" />
                                    </Link>
                                </Button>
                                <p className="text-sm font-semibold text-primary uppercase">
                                    Detail Task Pekerjaan
                                </p>
                            </div>
                            <h1 className="mt-2 text-2xl font-semibold text-foreground">
                                {kdkmpEntry.name}
                            </h1>
                            <p className="mt-2 max-w-3xl text-muted-foreground">
                                Daftar task yang telah diselesaikan oleh{' '}
                                <span className="font-medium text-foreground">
                                    {kdkmpEntry.manager?.name ?? 'Manager'}
                                </span>{' '}
                                pada tanggal{' '}
                                <span className="font-medium text-foreground">
                                    {formatDateDisplay(date)}
                                </span>
                                .
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
                                        <TableHead className="p-4">
                                            Status
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Belum ada tugas selesai pada
                                                tanggal ini.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {reports.map((report) => (
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
                                                    <Eye className="size-4" />
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Dialog
                open={selectedReport !== null}
                onOpenChange={(open) => !open && setSelectedReport(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-4xl">
                    <DialogHeader className="border-b p-6 pb-4">
                        <DialogTitle>Detail Laporan Tugas</DialogTitle>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-6 px-6 pb-6">
                            <section className="space-y-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {selectedReport.task.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {selectedReport.task.description ??
                                                'Tidak ada deskripsi.'}
                                        </p>
                                    </div>
                                    <Badge className="w-fit shrink-0">
                                        <CheckCircle2 className="size-3" />
                                        {selectedReport.status_label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">
                                        {selectedReport.task.task_category.name}
                                    </Badge>
                                    {selectedReport.task.roles.map((role) => (
                                        <Badge key={role.id} variant="outline">
                                            PIC: {role.name}
                                        </Badge>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h4 className="mb-3 text-sm font-semibold">
                                    Waktu Pengerjaan
                                </h4>
                                <div className="grid gap-3 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Waktu Mulai
                                        </p>
                                        <p className="mt-1 text-sm font-medium">
                                            {formatDateTime(
                                                selectedReport.started_at,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Waktu Selesai
                                        </p>
                                        <p className="mt-1 text-sm font-medium">
                                            {formatDateTime(
                                                selectedReport.finished_at,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Durasi Aktual
                                        </p>
                                        <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium">
                                            <Clock className="size-4 text-muted-foreground" />
                                            {formatDuration(
                                                selectedReport.duration_minutes,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Estimasi / Ambang Waktu
                                        </p>
                                        <p className="mt-1 text-sm font-medium">
                                            {selectedReport.task.time_require}{' '}
                                            menit
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatTimeThreshold(
                                                selectedReport.task
                                                    .lower_time_threshold_minutes,
                                                selectedReport.task
                                                    .upper_time_threshold_minutes,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                    <ImageIcon className="size-4" />
                                    Foto Pekerjaan
                                </h4>
                                {selectedReport.photos.length === 0 ? (
                                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                        Tidak ada foto yang dilampirkan.
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {selectedReport.photos.map((photo) => (
                                            <article
                                                key={photo.phase}
                                                className="overflow-hidden rounded-lg border bg-card"
                                            >
                                                <a
                                                    href={photo.preview_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    aria-label={`Preview ${photo.name}`}
                                                >
                                                    <img
                                                        src={photo.preview_url}
                                                        alt={photo.name}
                                                        className="aspect-video w-full bg-muted object-cover"
                                                    />
                                                </a>
                                                <div className="flex items-center justify-between gap-3 p-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {photo.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Tahap{' '}
                                                            {photo.phase_label}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    photo.preview_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                aria-label={`Preview ${photo.name}`}
                                                            >
                                                                <Eye className="size-4" />
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    photo.download_url
                                                                }
                                                                aria-label={`Download ${photo.name}`}
                                                            >
                                                                <Download className="size-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {selectedReport.values.length > 0 && (
                                <section>
                                    <h4 className="mb-3 text-sm font-semibold">
                                        Data Laporan
                                    </h4>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {selectedReport.values.map(
                                            (reportValue, index) => (
                                                <div
                                                    key={`${reportValue.phase}-${reportValue.label}-${index}`}
                                                    className="rounded-lg border p-3"
                                                >
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            reportValue.phase_label
                                                        }
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium">
                                                        {reportValue.label}
                                                    </p>
                                                    <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                                                        {formatReportValue(
                                                            reportValue.value,
                                                        )}
                                                    </p>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                    <FileText className="size-4" />
                                    Dokumen Terlampir
                                </h4>
                                {selectedReport.documents.length === 0 ? (
                                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                        Tidak ada dokumen yang dilampirkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedReport.documents.map(
                                            (document, index) => (
                                                <div
                                                    key={`${document.phase}-${document.name}-${index}`}
                                                    className="flex flex-col gap-3 rounded-md border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                                            <FileText className="size-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {document.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Tahap{' '}
                                                                {
                                                                    document.phase_label
                                                                }{' '}
                                                                ·{' '}
                                                                {formatFileSize(
                                                                    document.size,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 gap-2">
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
                                                                Preview
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
                                                                Unduh
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
