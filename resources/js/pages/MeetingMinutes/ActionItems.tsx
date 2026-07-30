import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    CircleDot,
    Clock3,
    History,
    ListChecks,
    Pencil,
    Search,
    UserRound,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as meetingMinutesIndex } from '@/routes/meeting-minutes';
import {
    index as meetingActionItemsIndex,
    update as updateMeetingActionItem,
} from '@/routes/meeting-minutes/action-items';
import type { PaginatedResponse } from '@/types/ebitda';
import type {
    MeetingActionItem,
    MeetingActionItemFilters,
    MeetingActionItemSummary,
    MeetingItemStatus,
} from '@/types/meeting-minute';
import { MEETING_ITEM_STATUSES, STATUS_LABELS } from '@/types/meeting-minute';

type Props = {
    actionItems: PaginatedResponse<MeetingActionItem>;
    summary: MeetingActionItemSummary;
    filters: MeetingActionItemFilters;
};

type StatusForm = {
    status: MeetingItemStatus;
    remarks: string;
};

const statusClasses: Record<MeetingItemStatus, string> = {
    open: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    in_progress:
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
    completed:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    cancelled:
        'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
};

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
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

function StatusBadge({ status }: { status: MeetingItemStatus }) {
    return (
        <Badge variant="outline" className={statusClasses[status]}>
            {STATUS_LABELS[status]}
        </Badge>
    );
}

export default function MeetingActionItemsIndex({
    actionItems,
    summary,
    filters,
}: Props) {
    const [selectedActionItem, setSelectedActionItem] =
        useState<MeetingActionItem | null>(null);
    const [filterForm, setFilterForm] = useState({
        search: filters.search ?? '',
        status: filters.status || 'all',
        overdue: filters.overdue ?? false,
    });

    const { data, setData, patch, processing, errors, clearErrors, reset } =
        useForm<StatusForm>({
            status: 'open',
            remarks: '',
        });

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            meetingActionItemsIndex.url(),
            {
                search: filterForm.search || undefined,
                status:
                    filterForm.status === 'all' ? undefined : filterForm.status,
                overdue: filterForm.overdue ? 1 : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const resetFilters = () => {
        setFilterForm({ search: '', status: 'all', overdue: false });
        router.get(meetingActionItemsIndex.url(), {}, { preserveScroll: true });
    };

    const openStatusDialog = (actionItem: MeetingActionItem) => {
        clearErrors();
        setSelectedActionItem(actionItem);
        setData({
            status: actionItem.status,
            remarks: actionItem.remarks ?? '',
        });
    };

    const closeStatusDialog = () => {
        setSelectedActionItem(null);
        clearErrors();
        reset();
    };

    const submitStatus = (event: FormEvent) => {
        event.preventDefault();

        if (!selectedActionItem) {
            return;
        }

        patch(updateMeetingActionItem.url(selectedActionItem.id), {
            preserveScroll: true,
            onSuccess: closeStatusDialog,
        });
    };

    const hasChanges = selectedActionItem
        ? data.status !== selectedActionItem.status ||
          data.remarks !== (selectedActionItem.remarks ?? '')
        : false;

    const summaryCards = [
        {
            label: 'Total Item',
            value: summary.total,
            icon: ListChecks,
            iconClass:
                'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
        },
        {
            label: 'Open',
            value: summary.open,
            icon: CircleDot,
            iconClass:
                'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        },
        {
            label: 'In Progress',
            value: summary.in_progress,
            icon: Clock3,
            iconClass:
                'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        },
        {
            label: 'Completed',
            value: summary.completed,
            icon: CheckCircle2,
            iconClass:
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        },
        {
            label: 'Terlambat',
            value: summary.overdue,
            icon: AlertTriangle,
            iconClass:
                'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        },
    ];

    return (
        <>
            <Head title="Monitoring Action Item MoM" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                    <section className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-sm font-semibold text-primary uppercase">
                            Minutes of Meeting
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold text-foreground">
                            Monitoring Action Item
                        </h1>
                        <p className="mt-2 max-w-3xl text-muted-foreground">
                            Pantau tindak lanjut hasil rapat, tenggat waktu,
                            PIC, dan riwayat perubahan status pada satu halaman.
                        </p>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {summaryCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <Card key={card.label} className="gap-3 py-5">
                                    <CardContent className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {card.label}
                                            </p>
                                            <p className="mt-1 text-2xl font-semibold">
                                                {card.value}
                                            </p>
                                        </div>
                                        <div
                                            className={`flex size-10 items-center justify-center rounded-lg ${card.iconClass}`}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>

                    <Card className="gap-0">
                        <CardHeader className="border-b">
                            <CardTitle>Filter Action Item</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form
                                onSubmit={submitFilters}
                                className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_220px_auto_auto] lg:items-end"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="action-item-search">
                                        Pencarian
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="action-item-search"
                                            value={filterForm.search}
                                            onChange={(event) =>
                                                setFilterForm((current) => ({
                                                    ...current,
                                                    search: event.target.value,
                                                }))
                                            }
                                            className="pl-9"
                                            placeholder="MoM, pembuat, subjek, action, atau PIC"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={filterForm.status}
                                        onValueChange={(status) =>
                                            setFilterForm((current) => ({
                                                ...current,
                                                status,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Semua status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua status
                                            </SelectItem>
                                            {MEETING_ITEM_STATUSES.map(
                                                (status) => (
                                                    <SelectItem
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {STATUS_LABELS[status]}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex h-9 items-center gap-2">
                                    <Checkbox
                                        id="overdue-only"
                                        checked={filterForm.overdue}
                                        onCheckedChange={(checked) =>
                                            setFilterForm((current) => ({
                                                ...current,
                                                overdue: checked === true,
                                            }))
                                        }
                                    />
                                    <Label
                                        htmlFor="overdue-only"
                                        className="cursor-pointer whitespace-nowrap"
                                    >
                                        Hanya yang terlambat
                                    </Label>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit">Terapkan</Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetFilters}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="gap-0">
                        <CardHeader className="border-b">
                            <CardTitle>Daftar Action Item</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="min-w-[220px] p-4">
                                            Meeting
                                        </TableHead>
                                        <TableHead className="min-w-[300px] p-4">
                                            Action Item
                                        </TableHead>
                                        <TableHead className="min-w-[150px] p-4">
                                            PIC
                                        </TableHead>
                                        <TableHead className="min-w-[150px] p-4">
                                            Tenggat
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Status
                                        </TableHead>
                                        <TableHead className="min-w-[220px] p-4">
                                            Catatan
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {actionItems.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="p-10 text-center text-muted-foreground"
                                            >
                                                Belum ada action item yang
                                                sesuai filter.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {actionItems.data.map((actionItem) => (
                                        <TableRow key={actionItem.id}>
                                            <TableCell className="p-4 align-top">
                                                <p className="font-medium text-foreground">
                                                    {
                                                        actionItem
                                                            .meeting_minute
                                                            .title
                                                    }
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatDate(
                                                        actionItem
                                                            .meeting_minute
                                                            .meeting_date,
                                                    )}
                                                </p>
                                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <UserRound className="size-3" />
                                                    {actionItem.meeting_minute
                                                        .creator?.name ??
                                                        'Data lama tanpa pemilik'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="p-4 align-top">
                                                <p className="font-medium text-foreground">
                                                    {actionItem.subject}
                                                </p>
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                    {actionItem.action ?? '-'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="p-4 align-top">
                                                {actionItem.pic ?? '-'}
                                            </TableCell>
                                            <TableCell className="p-4 align-top">
                                                <div className="space-y-1">
                                                    <p>
                                                        {formatDate(
                                                            actionItem.date_finish,
                                                        )}
                                                    </p>
                                                    {actionItem.is_overdue && (
                                                        <Badge variant="destructive">
                                                            <AlertTriangle className="size-3" />
                                                            Terlambat
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 align-top">
                                                <StatusBadge
                                                    status={actionItem.status}
                                                />
                                            </TableCell>
                                            <TableCell className="p-4 align-top text-sm text-muted-foreground">
                                                <p className="line-clamp-3">
                                                    {actionItem.remarks ?? '-'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="p-4 text-right align-top">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openStatusDialog(
                                                            actionItem,
                                                        )
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                    Update
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {actionItems.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {actionItems.from ?? 0}-
                                {actionItems.to ?? 0} dari {actionItems.total}{' '}
                                action item
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {actionItems.links.map((link) => (
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
                                                preserveState
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
                open={selectedActionItem !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeStatusDialog();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Update Action Item</DialogTitle>
                        <DialogDescription>
                            {selectedActionItem
                                ? `${selectedActionItem.meeting_minute.title} — ${selectedActionItem.subject}`
                                : 'Perbarui status dan catatan action item.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitStatus} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(status) =>
                                        setData(
                                            'status',
                                            status as MeetingItemStatus,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        aria-invalid={Boolean(errors.status)}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MEETING_ITEM_STATUSES.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {STATUS_LABELS[status]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-xs text-destructive">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Tenggat</Label>
                                <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm">
                                    {formatDate(
                                        selectedActionItem?.date_finish ?? null,
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="action-item-remarks">
                                Catatan terbaru
                            </Label>
                            <textarea
                                id="action-item-remarks"
                                value={data.remarks}
                                onChange={(event) =>
                                    setData('remarks', event.target.value)
                                }
                                rows={4}
                                maxLength={5000}
                                aria-invalid={Boolean(errors.remarks)}
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                placeholder="Tambahkan progres, kendala, atau hasil tindak lanjut..."
                            />
                            <div className="flex justify-between gap-4">
                                {errors.remarks ? (
                                    <p className="text-xs text-destructive">
                                        {errors.remarks}
                                    </p>
                                ) : (
                                    <span />
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {data.remarks.length}/5000
                                </p>
                            </div>
                        </div>

                        <section className="space-y-3 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <History className="size-4 text-muted-foreground" />
                                <h2 className="font-medium">
                                    Riwayat Perubahan
                                </h2>
                            </div>

                            {!selectedActionItem ||
                            selectedActionItem.status_histories.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada riwayat perubahan status.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedActionItem.status_histories.map(
                                        (history) => (
                                            <div
                                                key={history.id}
                                                className="rounded-md bg-muted/40 p-3"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {history.from_status ===
                                                        history.to_status ? (
                                                            <span className="text-sm font-medium">
                                                                Catatan
                                                                diperbarui
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <StatusBadge
                                                                    status={
                                                                        history.from_status
                                                                    }
                                                                />
                                                                <span className="text-sm text-muted-foreground">
                                                                    →
                                                                </span>
                                                                <StatusBadge
                                                                    status={
                                                                        history.to_status
                                                                    }
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                    <time className="text-xs text-muted-foreground">
                                                        {formatDateTime(
                                                            history.created_at,
                                                        )}
                                                    </time>
                                                </div>
                                                <p className="mt-2 text-sm">
                                                    {history.note ||
                                                        'Tanpa catatan.'}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Oleh{' '}
                                                    {history.changed_by_name}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </section>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeStatusDialog}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !hasChanges}
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

MeetingActionItemsIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Minutes of Meeting',
            href: meetingMinutesIndex(),
        },
        {
            title: 'Action Item',
            href: meetingActionItemsIndex(),
        },
    ],
};
