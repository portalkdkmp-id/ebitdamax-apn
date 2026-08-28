import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock,
    Download,
    Eye,
    FileText,
    TriangleAlert,
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

type ReportUser = {
    id: number;
    name: string;
    username: string | null;
    email: string;
} | null;

type CompletedTask = {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    time_require: number;
    task_category: TaskCategoryOption;
    roles: UserRole[];
};

type CompletedTaskReport = {
    id: number;
    uuid: string;
    started_at: string | null;
    finished_at: string | null;
    duration_minutes: number | null;
    manager_self_assigned: boolean;
    status_label: string;
    timing_status: 'on_time' | 'late';
    timing_label: string;
    documents: TaskReportDocument[];
    user: ReportUser;
    task: CompletedTask;
};

type NotWorkedTask = {
    task: CompletedTask;
    user: ReportUser;
};

type CompletedTaskDay = {
    date: string;
    total_tasks: number;
    on_time_tasks: number;
    late_tasks: number;
    not_worked_tasks: NotWorkedTask[];
    completed_reports: CompletedTaskReport[];
};

type Props = {
    reports: PaginatedResponse<CompletedTaskDay>;
    isSuperadmin: boolean;
};

function dateFromKey(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
}

function formatWeekday(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
    }).format(dateFromKey(value));
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(dateFromKey(value));
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function paginationLabel(label: string): string {
    if (label.includes('Previous')) {
        return 'Sebelumnya';
    }

    if (label.includes('Next')) {
        return 'Berikutnya';
    }

    return label;
}

function DocumentList({ documents }: { documents: TaskReportDocument[] }) {
    if (documents.length === 0) {
        return (
            <p className="text-xs text-muted-foreground">
                Tidak ada dokumen terlampir.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {documents.map((document, index) => (
                <div
                    key={document.phase + '-' + document.name + '-' + index}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3"
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {document.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Fase: {document.phase_label}
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
                                href={document.preview_url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={'Preview ' + document.name}
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
                                href={document.download_url}
                                aria-label={'Download ' + document.name}
                                className="flex items-center gap-1"
                            >
                                <Download className="size-3.5" />
                                <span className="hidden sm:inline">Unduh</span>
                            </a>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CompletedReportCard({
    report,
    isSuperadmin,
}: {
    report: CompletedTaskReport;
    isSuperadmin: boolean;
}) {
    const isOnTime = report.timing_status === 'on_time';

    return (
        <Card className="gap-4 rounded-xl border p-4 shadow-none">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ClipboardList className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">
                            {report.task.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {report.task.task_category.name}
                        </p>
                        {report.manager_self_assigned && (
                            <Badge variant="outline" className="mt-2">
                                Dikerjakan sendiri oleh Manager KDKMP
                            </Badge>
                        )}
                    </div>
                </div>
                <Badge
                    variant={isOnTime ? 'secondary' : 'destructive'}
                    className="self-start"
                >
                    {isOnTime ? (
                        <CheckCircle2 className="size-3" />
                    ) : (
                        <TriangleAlert className="size-3" />
                    )}
                    {report.timing_label}
                </Badge>
            </div>

            {report.task.description && (
                <p className="text-sm text-muted-foreground">
                    {report.task.description}
                </p>
            )}

            <div className="grid gap-3 rounded-lg bg-muted/30 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <p className="text-xs text-muted-foreground">Waktu Mulai</p>
                    <p className="font-medium">
                        {formatDateTime(report.started_at)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">
                        Waktu Selesai
                    </p>
                    <p className="font-medium">
                        {formatDateTime(report.finished_at)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">
                        Durasi / Estimasi
                    </p>
                    <p className="inline-flex items-center gap-1 font-medium">
                        <Clock className="size-4 text-muted-foreground" />
                        {report.duration_minutes ?? 0} /{' '}
                        {report.task.time_require} menit
                    </p>
                </div>
                {isSuperadmin && (
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Diselesaikan Oleh
                        </p>
                        <p className="font-medium">
                            {report.user?.name ?? '-'}
                        </p>
                    </div>
                )}
            </div>

            <div>
                <h4 className="mb-2 text-sm font-semibold">
                    Dokumen Terlampir
                </h4>
                <DocumentList documents={report.documents} />
            </div>
        </Card>
    );
}

function NotWorkedTaskList({
    tasks,
    isSuperadmin,
}: {
    tasks: NotWorkedTask[];
    isSuperadmin: boolean;
}) {
    if (tasks.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="mb-3 flex items-center gap-2">
                <TriangleAlert className="size-4 text-destructive" />
                <h3 className="font-semibold text-destructive">
                    Task Tidak Dikerjakan ({tasks.length})
                </h3>
            </div>
            <div className="space-y-2">
                {tasks.map((item) => (
                    <div
                        key={
                            item.task.uuid +
                            '-' +
                            (item.user?.id ?? 'current-user')
                        }
                        className="rounded-lg border border-destructive/10 bg-background p-3"
                    >
                        <p className="font-medium text-foreground">
                            {item.task.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {item.task.task_category.name}
                            {isSuperadmin && item.user
                                ? ' · ' + item.user.name
                                : ''}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DayDetailDialog({
    day,
    isSuperadmin,
    open,
    onOpenChange,
}: {
    day: CompletedTaskDay | null;
    isSuperadmin: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="size-5 text-primary" />
                        Detail Tugas —{' '}
                        {day ? formatDate(day.date) : 'Tidak tersedia'}
                    </DialogTitle>
                </DialogHeader>

                {day && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <SummaryMetric
                                label="Jumlah Tugas"
                                value={day.total_tasks}
                            />
                            <SummaryMetric
                                label="Tepat Waktu"
                                value={day.on_time_tasks}
                                tone="success"
                            />
                            <SummaryMetric
                                label="Terlambat"
                                value={day.late_tasks}
                                tone="warning"
                            />
                            <SummaryMetric
                                label="Tidak Dikerjakan"
                                value={day.not_worked_tasks.length}
                                tone="danger"
                            />
                        </div>

                        {day.completed_reports.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-foreground">
                                    Detail Task Selesai
                                </h3>
                                {day.completed_reports.map((report) => (
                                    <CompletedReportCard
                                        key={report.uuid}
                                        report={report}
                                        isSuperadmin={isSuperadmin}
                                    />
                                ))}
                            </div>
                        )}

                        <NotWorkedTaskList
                            tasks={day.not_worked_tasks}
                            isSuperadmin={isSuperadmin}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SummaryMetric({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: number;
    tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
    const toneClass = {
        default: 'bg-muted/40 text-foreground',
        success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        danger: 'bg-destructive/10 text-destructive',
    }[tone];

    return (
        <div className={'rounded-xl p-3 ' + toneClass}>
            <p className="text-xs">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
    );
}

export default function CompletedTaskDashboard({
    reports,
    isSuperadmin,
}: Props) {
    const [selectedDay, setSelectedDay] = useState<CompletedTaskDay | null>(
        null,
    );

    return (
        <>
            <Head title="Tugas sudah selesai" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                Laporan Pekerjaan
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Tugas sudah selesai
                            </h1>
                            <p className="mt-2 max-w-3xl text-muted-foreground">
                                Ringkasan tugas harian dalam 14 hari terakhir,
                                berdasarkan durasi pengerjaan dan target tugas
                                yang ditetapkan.
                            </p>
                        </div>
                    </section>

                    <Card className="rounded-2xl border bg-card shadow-sm">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle>Riwayat Tugas Selesai</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="px-3 pb-3 sm:px-4">
                                <Table className="border-separate border-spacing-y-2">
                                    <TableHeader className="[&_tr]:border-0">
                                        <TableRow className="border-0 hover:bg-transparent">
                                            <TableHead className="min-w-[220px] rounded-l-xl bg-muted/40 p-4">
                                                Tanggal
                                            </TableHead>
                                            <TableHead className="bg-muted/40 p-4">
                                                Jumlah
                                            </TableHead>
                                            <TableHead className="rounded-r-xl bg-muted/40 p-4 text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reports.data.length === 0 && (
                                            <TableRow className="border-0 hover:bg-transparent">
                                                <TableCell
                                                    colSpan={3}
                                                    className="rounded-xl border border-dashed bg-muted/20 p-8 text-center text-muted-foreground"
                                                >
                                                    Belum ada tugas selesai.
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {reports.data.map((day) => (
                                            <TableRow
                                                key={day.date}
                                                className="border-0 hover:bg-transparent"
                                            >
                                                <TableCell className="rounded-l-xl border-y border-l bg-card p-4">
                                                    <div className="inline-flex min-w-36 flex-col rounded-xl bg-primary/10 px-4 py-3 text-center">
                                                        <span className="text-xs font-semibold text-primary capitalize">
                                                            {formatWeekday(
                                                                day.date,
                                                            )}
                                                        </span>
                                                        <span className="mt-1 text-sm font-medium text-foreground">
                                                            {formatDate(
                                                                day.date,
                                                            )}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border-y bg-card p-4">
                                                    <div className="grid gap-x-5 gap-y-1 text-sm sm:grid-cols-2">
                                                        <span className="font-semibold text-foreground">
                                                            Jumlah Tugas =&gt;{' '}
                                                            {day.total_tasks}
                                                        </span>
                                                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                                                            Terlambat =&gt;{' '}
                                                            {day.late_tasks}
                                                        </span>
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                            Tepat Waktu =&gt;{' '}
                                                            {day.on_time_tasks}
                                                        </span>
                                                        <span className="font-semibold text-destructive">
                                                            Tidak Dikerjakan
                                                            =&gt;{' '}
                                                            {
                                                                day
                                                                    .not_worked_tasks
                                                                    .length
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="rounded-r-xl border-y border-r bg-card p-4 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        className="rounded-xl"
                                                        onClick={() =>
                                                            setSelectedDay(day)
                                                        }
                                                    >
                                                        Tampilkan Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {reports.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {reports.from ?? 0}-
                                {reports.to ?? 0} dari {reports.total} hari
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {reports.links.map((link) => (
                                    <Button
                                        key={link.label + '-' + link.url}
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

            <DayDetailDialog
                day={selectedDay}
                isSuperadmin={isSuperadmin}
                open={selectedDay !== null}
                onOpenChange={(open) => !open && setSelectedDay(null)}
            />
        </>
    );
}
