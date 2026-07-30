import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    Clock,
    ClipboardList,
    Download,
    Eye,
    FileText,
    MapPin,
    Paperclip,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

import {
    destroy as destroyMeetingMinute,
    index as meetingMinutesIndex,
    store as storeMeetingMinute,
    update as updateMeetingMinute,
} from '@/routes/meeting-minutes';
import type {
    MeetingMinute,
    MeetingMinuteAttachment,
    MeetingMinuteItem,
    MeetingMinuteFilters,
} from '@/types/meeting-minute';
import { MEETING_ITEM_STATUSES, STATUS_LABELS } from '@/types/meeting-minute';

type Props = {
    meetingMinutes: MeetingMinute[];
    canViewAll: boolean;
    filters: MeetingMinuteFilters;
};

type MeetingForm = {
    _method: 'post' | 'put';
    title: string;
    meeting_date: string;
    start_time: string;
    end_time: string;
    location: string;
    attendees: string;
    items: MeetingMinuteItem[];
    documents: File[];
    removed_attachment_ids: number[];
};

const MAX_DOCUMENT_COUNT = 10;
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

const emptyItem = (): MeetingMinuteItem => ({
    subject: '',
    description: null,
    action: null,
    objectives: null,
    date_start: null,
    date_finish: null,
    pic: null,
    status: 'open',
    remarks: null,
});

const emptyForm = (): MeetingForm => ({
    _method: 'post',
    title: '',
    meeting_date: '',
    start_time: '',
    end_time: '',
    location: '',
    attendees: '',
    items: [emptyItem()],
    documents: [],
    removed_attachment_ids: [],
});

function statusVariant(
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'completed':
            return 'default';
        case 'in_progress':
            return 'secondary';
        case 'cancelled':
            return 'destructive';
        default:
            return 'outline';
    }
}

function formatFileSize(size: number): string {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MeetingMinutesIndex({
    meetingMinutes,
    canViewAll,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [reviewTarget, setReviewTarget] = useState<MeetingMinute | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] = useState<MeetingMinute | null>(
        null,
    );
    const [fileInputKey, setFileInputKey] = useState(0);
    const [documentSelectionError, setDocumentSelectionError] = useState<
        string | null
    >(null);

    const { data, setData, post, processing, progress, errors, clearErrors } =
        useForm<MeetingForm>(emptyForm());

    const editingMeeting =
        meetingMinutes.find((meeting) => meeting.id === editingId) ?? null;
    const documentError =
        documentSelectionError ??
        errors.documents ??
        Object.entries(errors).find(([field]) =>
            field.startsWith('documents.'),
        )?.[1];

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.visit(meetingMinutesIndex(), {
            data: { search },
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const openCreate = () => {
        clearErrors();
        setData(emptyForm());
        setFileInputKey((current) => current + 1);
        setDocumentSelectionError(null);
        setEditingId(null);
        setDialogOpen(true);
    };

    const openEdit = (meeting: MeetingMinute) => {
        clearErrors();
        setDocumentSelectionError(null);
        setEditingId(meeting.id);
        setData({
            _method: 'put',
            title: meeting.title,
            meeting_date: meeting.meeting_date,
            start_time: meeting.start_time ?? '',
            end_time: meeting.end_time ?? '',
            location: meeting.location ?? '',
            attendees: meeting.attendees ?? '',
            items:
                meeting.items.length > 0
                    ? meeting.items.map((item) => ({
                          ...item,
                          description: item.description ?? null,
                          action: item.action ?? null,
                          objectives: item.objectives ?? null,
                          date_start: item.date_start ?? null,
                          date_finish: item.date_finish ?? null,
                          pic: item.pic ?? null,
                          remarks: item.remarks ?? null,
                      }))
                    : [emptyItem()],
            documents: [],
            removed_attachment_ids: [],
        });
        setFileInputKey((current) => current + 1);
        setDialogOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(
            editingId
                ? updateMeetingMinute.url(editingId)
                : storeMeetingMinute.url(),
            {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    setFileInputKey((current) => current + 1);
                    clearErrors();
                },
            },
        );
    };

    const confirmDelete = (meeting: MeetingMinute) => {
        setDeleteTarget(meeting);
    };

    const handleDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(destroyMeetingMinute.url(deleteTarget.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const addItem = () => {
        setData('items', [...data.items, emptyItem()]);
    };

    const removeItem = (index: number) => {
        if (data.items.length <= 1) {
            return;
        }

        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };

    const updateItem = (
        index: number,
        field: keyof MeetingMinuteItem,
        value: string,
    ) => {
        const updated = [...data.items];
        updated[index] = { ...updated[index], [field]: value };
        setData('items', updated);
    };

    const handleDocumentSelection = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedDocuments = Array.from(event.target.files ?? []);

        if (selectedDocuments.length === 0) {
            return;
        }

        const oversizedDocument = selectedDocuments.find(
            (document) => document.size > MAX_DOCUMENT_SIZE_BYTES,
        );

        if (oversizedDocument) {
            setDocumentSelectionError(
                `File "${oversizedDocument.name}" ditolak karena ukurannya lebih dari 10 MB.`,
            );
            setFileInputKey((current) => current + 1);

            return;
        }

        if (
            data.documents.length + selectedDocuments.length >
            MAX_DOCUMENT_COUNT
        ) {
            setDocumentSelectionError(
                'Maksimal 10 dokumen dalam satu kali upload.',
            );
            setFileInputKey((current) => current + 1);

            return;
        }

        setDocumentSelectionError(null);
        setData('documents', [...data.documents, ...selectedDocuments]);
        setFileInputKey((current) => current + 1);
    };

    const removeSelectedDocument = (index: number) => {
        setDocumentSelectionError(null);
        setData(
            'documents',
            data.documents.filter(
                (_, documentIndex) => documentIndex !== index,
            ),
        );
    };

    const toggleExistingAttachment = (attachment: MeetingMinuteAttachment) => {
        const isMarkedForRemoval = data.removed_attachment_ids.includes(
            attachment.id,
        );

        setData(
            'removed_attachment_ids',
            isMarkedForRemoval
                ? data.removed_attachment_ids.filter(
                      (id) => id !== attachment.id,
                  )
                : [...data.removed_attachment_ids, attachment.id],
        );
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (time: string | null) => {
        if (!time) {
            return '-';
        }

        return time.slice(0, 5);
    };

    return (
        <>
            <Head title="Minutes of Meeting" />

            <div className="min-h-screen bg-background">
                <div className="space-y-6 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Minutes of Meeting
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                Pencatatan penjadwalan penggunaan minutes of
                                meeting rapat pengendalian EBITDA
                            </p>
                        </div>
                        <Button onClick={openCreate} disabled={processing}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Meeting
                        </Button>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-10"
                                placeholder="Cari judul, lokasi, atau peserta..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button type="submit" variant="outline">
                            Cari
                        </Button>
                    </form>

                    <div className="space-y-6">
                        {meetingMinutes.map((meeting) => (
                            <Card
                                key={meeting.id}
                                className="border bg-card shadow-sm"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-3">
                                            <CardTitle className="text-lg">
                                                {meeting.title}
                                            </CardTitle>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {formatDate(
                                                        meeting.meeting_date,
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    {formatTime(
                                                        meeting.start_time,
                                                    )}{' '}
                                                    -{' '}
                                                    {formatTime(
                                                        meeting.end_time,
                                                    )}
                                                </span>
                                                {meeting.location && (
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-4 w-4" />
                                                        {meeting.location}
                                                    </span>
                                                )}
                                                {meeting.attendees && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Users className="h-4 w-4" />
                                                        {meeting.attendees}
                                                    </span>
                                                )}
                                                {canViewAll && (
                                                    <span className="flex items-center gap-1.5">
                                                        <UserRound className="h-4 w-4" />
                                                        {meeting.creator
                                                            ?.name ??
                                                            'Data lama tanpa pemilik'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setReviewTarget(meeting)
                                                }
                                            >
                                                <Eye className="mr-1.5 h-4 w-4" />
                                                Review
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    openEdit(meeting)
                                                }
                                                disabled={processing}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    confirmDelete(meeting)
                                                }
                                                disabled={processing}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {meeting.attachments.length > 0 && (
                                        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                                            <Paperclip className="h-4 w-4" />
                                            {meeting.attachments.length} dokumen
                                            terlampir
                                        </div>
                                    )}
                                    {meeting.items.length === 0 ? (
                                        <p className="py-4 text-center text-sm text-muted-foreground">
                                            Belum ada item pembahasan.
                                        </p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">
                                                        No
                                                    </TableHead>
                                                    <TableHead className="w-40">
                                                        Subject
                                                    </TableHead>
                                                    <TableHead>
                                                        Description
                                                    </TableHead>
                                                    <TableHead>
                                                        Action
                                                    </TableHead>
                                                    <TableHead>
                                                        Objectives
                                                    </TableHead>
                                                    <TableHead className="w-28">
                                                        Date Start
                                                    </TableHead>
                                                    <TableHead className="w-28">
                                                        Date Finish
                                                    </TableHead>
                                                    <TableHead className="w-32">
                                                        PIC
                                                    </TableHead>
                                                    <TableHead className="w-28">
                                                        Status
                                                    </TableHead>
                                                    <TableHead>
                                                        Remarks
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {meeting.items.map(
                                                    (item, idx) => (
                                                        <TableRow
                                                            key={item.id ?? idx}
                                                        >
                                                            <TableCell className="text-muted-foreground">
                                                                {idx + 1}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {item.subject}
                                                            </TableCell>
                                                            <TableCell className="max-w-48 truncate text-muted-foreground">
                                                                {item.description ??
                                                                    '-'}
                                                            </TableCell>
                                                            <TableCell className="max-w-48 truncate text-muted-foreground">
                                                                {item.action ??
                                                                    '-'}
                                                            </TableCell>
                                                            <TableCell className="max-w-48 truncate text-muted-foreground">
                                                                {item.objectives ??
                                                                    '-'}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {item.date_start ??
                                                                    '-'}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {item.date_finish ??
                                                                    '-'}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {item.pic ??
                                                                    '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={statusVariant(
                                                                        item.status,
                                                                    )}
                                                                >
                                                                    {STATUS_LABELS[
                                                                        item.status as keyof typeof STATUS_LABELS
                                                                    ] ??
                                                                        item.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="max-w-48 truncate text-muted-foreground">
                                                                {item.remarks ??
                                                                    '-'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {meetingMinutes.length === 0 && (
                            <div className="rounded-lg border-2 border-dashed p-12 text-center">
                                <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
                                <p className="mt-3 text-muted-foreground">
                                    Belum ada data minutes of meeting.{' '}
                                    <button
                                        type="button"
                                        onClick={openCreate}
                                        className="font-medium text-primary underline underline-offset-4"
                                    >
                                        Tambahkan sekarang.
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-7xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId
                                ? 'Edit Minutes of Meeting'
                                : 'Tambah Minutes of Meeting'}
                        </DialogTitle>
                        <DialogDescription>
                            Isi header meeting dan item-item pembahasan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="title">Judul Meeting</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    placeholder="Rapat Pengendalian EBITDA ..."
                                />
                                {errors.title && (
                                    <p className="text-sm text-destructive">
                                        {errors.title}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meeting_date">Tanggal</Label>
                                <Input
                                    id="meeting_date"
                                    type="date"
                                    value={data.meeting_date}
                                    onChange={(e) =>
                                        setData('meeting_date', e.target.value)
                                    }
                                />
                                {errors.meeting_date && (
                                    <p className="text-sm text-destructive">
                                        {errors.meeting_date}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Tempat</Label>
                                <Input
                                    id="location"
                                    value={data.location}
                                    onChange={(e) =>
                                        setData('location', e.target.value)
                                    }
                                    placeholder="Ruang Rapat Utama"
                                />
                                {errors.location && (
                                    <p className="text-sm text-destructive">
                                        {errors.location}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="start_time">Jam Mulai</Label>
                                <Input
                                    id="start_time"
                                    type="time"
                                    value={data.start_time}
                                    onChange={(e) =>
                                        setData('start_time', e.target.value)
                                    }
                                />
                                {errors.start_time && (
                                    <p className="text-sm text-destructive">
                                        {errors.start_time}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_time">Jam Selesai</Label>
                                <Input
                                    id="end_time"
                                    type="time"
                                    value={data.end_time}
                                    onChange={(e) =>
                                        setData('end_time', e.target.value)
                                    }
                                />
                                {errors.end_time && (
                                    <p className="text-sm text-destructive">
                                        {errors.end_time}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="attendees">Kehadiran</Label>
                                <Input
                                    id="attendees"
                                    value={data.attendees}
                                    onChange={(e) =>
                                        setData('attendees', e.target.value)
                                    }
                                    placeholder="Budi, Ani, Candra (pisahkan dengan koma)"
                                />
                                {errors.attendees && (
                                    <p className="text-sm text-destructive">
                                        {errors.attendees}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 rounded-lg border p-4">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-semibold">
                                    <Paperclip className="h-4 w-4" />
                                    Dokumen Pendukung
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Maksimal 10 file per unggahan dan 10 MB per
                                    file.
                                </p>
                            </div>

                            {editingMeeting &&
                                editingMeeting.attachments.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Dokumen tersimpan</Label>
                                        {editingMeeting.attachments.map(
                                            (attachment) => {
                                                const isMarkedForRemoval =
                                                    data.removed_attachment_ids.includes(
                                                        attachment.id,
                                                    );

                                                return (
                                                    <div
                                                        key={attachment.id}
                                                        className={`flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${
                                                            isMarkedForRemoval
                                                                ? 'border-destructive/40 bg-destructive/5 opacity-70'
                                                                : 'bg-muted/20'
                                                        }`}
                                                    >
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                                            <div className="min-w-0">
                                                                <p
                                                                    className={`truncate text-sm font-medium ${
                                                                        isMarkedForRemoval
                                                                            ? 'line-through'
                                                                            : ''
                                                                    }`}
                                                                >
                                                                    {
                                                                        attachment.name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatFileSize(
                                                                        attachment.size,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {!isMarkedForRemoval && (
                                                                <>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        asChild
                                                                    >
                                                                        <a
                                                                            href={
                                                                                attachment.preview_url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                        >
                                                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                                            Preview
                                                                        </a>
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        asChild
                                                                    >
                                                                        <a
                                                                            href={
                                                                                attachment.download_url
                                                                            }
                                                                        >
                                                                            <Download className="mr-1.5 h-3.5 w-3.5" />
                                                                            Download
                                                                        </a>
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <Button
                                                                type="button"
                                                                variant={
                                                                    isMarkedForRemoval
                                                                        ? 'outline'
                                                                        : 'destructive'
                                                                }
                                                                size="sm"
                                                                onClick={() =>
                                                                    toggleExistingAttachment(
                                                                        attachment,
                                                                    )
                                                                }
                                                            >
                                                                {isMarkedForRemoval
                                                                    ? 'Batalkan Hapus'
                                                                    : 'Hapus'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}

                            <div className="space-y-2">
                                <Label htmlFor="documents">
                                    Tambah dokumen
                                </Label>
                                <Input
                                    key={fileInputKey}
                                    id="documents"
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png"
                                    onChange={handleDocumentSelection}
                                    disabled={
                                        processing ||
                                        data.documents.length >=
                                            MAX_DOCUMENT_COUNT
                                    }
                                />
                                {documentError && (
                                    <p className="text-sm text-destructive">
                                        {documentError}
                                    </p>
                                )}
                            </div>

                            {data.documents.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Dokumen baru</Label>
                                    {data.documents.map((document, index) => (
                                        <div
                                            key={`${document.name}-${document.lastModified}-${index}`}
                                            className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 p-3"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {document.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatFileSize(
                                                            document.size,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    removeSelectedDocument(
                                                        index,
                                                    )
                                                }
                                                aria-label={`Hapus ${document.name}`}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {progress && (
                                <div className="space-y-1">
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{
                                                width: `${progress.percentage}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Mengunggah {progress.percentage}%
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">
                                    Item Pembahasan
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                >
                                    <Plus className="mr-1 h-3 w-3" /> Tambah
                                    Item
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {data.items.map((item, index) => (
                                    <Card
                                        key={index}
                                        className="border bg-muted/30 p-4"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                Item #{index + 1}
                                            </span>
                                            {data.items.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        removeItem(index)
                                                    }
                                                    className="h-6 w-6"
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label>Subject</Label>
                                                <Input
                                                    value={item.subject}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            'subject',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Pembahasan utama..."
                                                />
                                                {errors[
                                                    `items.${index}.subject`
                                                ] && (
                                                    <p className="text-xs text-destructive">
                                                        {
                                                            errors[
                                                                `items.${index}.subject`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label>Description</Label>
                                                <textarea
                                                    value={
                                                        item.description ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            'description',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Deskripsi detail..."
                                                    rows={2}
                                                    className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                                />
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label>Action</Label>
                                                <textarea
                                                    value={item.action ?? ''}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            'action',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Tindakan yang diperlukan..."
                                                    rows={2}
                                                    className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                                />
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label>Objectives</Label>
                                                <textarea
                                                    value={
                                                        item.objectives ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            'objectives',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Tujuan yang ingin dicapai..."
                                                    rows={2}
                                                    className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Date Start</Label>
                                                <Input
                                                    type="date"
                                                    value={
                                                        item.date_start ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            'date_start',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Date Finish</Label>
                                                <Input
                                                    type="date"
                                                    value={
                                                        item.date_finish ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            'date_finish',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>PIC</Label>
                                                <Input
                                                    value={item.pic ?? ''}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            'pic',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Nama PIC"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Status</Label>
                                                <Select
                                                    value={item.status}
                                                    onValueChange={(value) =>
                                                        updateItem(
                                                            index,
                                                            'status',
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {MEETING_ITEM_STATUSES.map(
                                                            (s) => (
                                                                <SelectItem
                                                                    key={s}
                                                                    value={s}
                                                                >
                                                                    {
                                                                        STATUS_LABELS[
                                                                            s
                                                                        ]
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label>Remarks</Label>
                                                <textarea
                                                    value={item.remarks ?? ''}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            'remarks',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Catatan tambahan..."
                                                    rows={2}
                                                    className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingId ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={reviewTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setReviewTarget(null);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>{reviewTarget?.title}</DialogTitle>
                        <DialogDescription>
                            Review hasil minutes of meeting dan dokumen
                            pendukung.
                        </DialogDescription>
                    </DialogHeader>

                    {reviewTarget && (
                        <div className="space-y-6">
                            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Tanggal dan Waktu
                                    </p>
                                    <p className="mt-1 text-sm">
                                        {formatDate(reviewTarget.meeting_date)},{' '}
                                        {formatTime(reviewTarget.start_time)} -{' '}
                                        {formatTime(reviewTarget.end_time)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Tempat
                                    </p>
                                    <p className="mt-1 text-sm">
                                        {reviewTarget.location ?? '-'}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Kehadiran
                                    </p>
                                    <p className="mt-1 text-sm">
                                        {reviewTarget.attendees ?? '-'}
                                    </p>
                                </div>
                                {canViewAll && (
                                    <div className="sm:col-span-2">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Dibuat Oleh
                                        </p>
                                        <p className="mt-1 text-sm">
                                            {reviewTarget.creator?.name ??
                                                'Data lama tanpa pemilik'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <h3 className="flex items-center gap-2 text-sm font-semibold">
                                    <Paperclip className="h-4 w-4" />
                                    Dokumen Pendukung
                                </h3>
                                {reviewTarget.attachments.length === 0 ? (
                                    <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                        Tidak ada dokumen terlampir.
                                    </p>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {reviewTarget.attachments.map(
                                            (attachment) => (
                                                <div
                                                    key={attachment.id}
                                                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {
                                                                    attachment.name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatFileSize(
                                                                    attachment.size,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    attachment.preview_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                aria-label={`Preview ${attachment.name}`}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    attachment.download_url
                                                                }
                                                                aria-label={`Download ${attachment.name}`}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold">
                                    Hasil Pembahasan
                                </h3>
                                {reviewTarget.items.length === 0 ? (
                                    <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                        Belum ada hasil pembahasan.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {reviewTarget.items.map(
                                            (item, index) => (
                                                <Card
                                                    key={item.id ?? index}
                                                    className="p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Item #
                                                                {index + 1}
                                                            </p>
                                                            <h4 className="font-medium">
                                                                {item.subject}
                                                            </h4>
                                                        </div>
                                                        <Badge
                                                            variant={statusVariant(
                                                                item.status,
                                                            )}
                                                        >
                                                            {STATUS_LABELS[
                                                                item.status as keyof typeof STATUS_LABELS
                                                            ] ?? item.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground">
                                                                Description
                                                            </p>
                                                            <p className="mt-1 whitespace-pre-wrap">
                                                                {item.description ??
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground">
                                                                Action
                                                            </p>
                                                            <p className="mt-1 whitespace-pre-wrap">
                                                                {item.action ??
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground">
                                                                Objectives
                                                            </p>
                                                            <p className="mt-1 whitespace-pre-wrap">
                                                                {item.objectives ??
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground">
                                                                PIC dan Periode
                                                            </p>
                                                            <p className="mt-1">
                                                                {item.pic ??
                                                                    '-'}{' '}
                                                                ·{' '}
                                                                {item.date_start ??
                                                                    '-'}
                                                                {' sampai '}
                                                                {item.date_finish ??
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <p className="text-xs font-medium text-muted-foreground">
                                                                Remarks
                                                            </p>
                                                            <p className="mt-1 whitespace-pre-wrap">
                                                                {item.remarks ??
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Minutes of Meeting</DialogTitle>
                        <DialogDescription>
                            Anda akan menghapus "{deleteTarget?.title}". Semua
                            item pembahasan dan dokumen terlampir juga akan
                            terhapus. Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

MeetingMinutesIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Minutes of Meeting',
            href: meetingMinutesIndex(),
        },
    ],
};
