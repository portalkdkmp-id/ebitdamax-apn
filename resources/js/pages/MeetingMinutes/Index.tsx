import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    Clock,
    ClipboardList,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
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

import { index as meetingMinutesIndex } from '@/routes/meeting-minutes';
import type {
    MeetingMinute,
    MeetingMinuteItem,
    MeetingMinuteFilters,
} from '@/types/meeting-minute';
import {
    MEETING_ITEM_STATUSES,
    STATUS_LABELS,
} from '@/types/meeting-minute';

type Props = {
    meetingMinutes: MeetingMinute[];
    filters: MeetingMinuteFilters;
};

type MeetingForm = {
    title: string;
    meeting_date: string;
    start_time: string;
    end_time: string;
    location: string;
    attendees: string;
    items: MeetingMinuteItem[];
};

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
    title: '',
    meeting_date: '',
    start_time: '',
    end_time: '',
    location: '',
    attendees: '',
    items: [emptyItem()],
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

export default function MeetingMinutesIndex({ meetingMinutes, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MeetingMinute | null>(null);

    const { data, setData, post, put, processing, reset, errors, clearErrors } =
        useForm<MeetingForm>(emptyForm());

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
        reset(emptyForm());
        setEditingId(null);
        setDialogOpen(true);
    };

    const openEdit = (meeting: MeetingMinute) => {
        clearErrors();
        setEditingId(meeting.id);
        setData({
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
        });
        setDialogOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/meeting-minutes/${editingId}`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    clearErrors();
                },
            });
        } else {
            post('/meeting-minutes', {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    clearErrors();
                },
            });
        }
    };

    const confirmDelete = (meeting: MeetingMinute) => {
        setDeleteTarget(meeting);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/meeting-minutes/${deleteTarget.id}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const addItem = () => {
        setData('items', [...data.items, emptyItem()]);
    };

    const removeItem = (index: number) => {
        if (data.items.length <= 1) return;
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };

    const updateItem = (index: number, field: keyof MeetingMinuteItem, value: string) => {
        const updated = [...data.items];
        updated[index] = { ...updated[index], [field]: value };
        setData('items', updated);
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
        if (!time) return '-';
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
                            <Card key={meeting.id} className="border bg-card shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-3">
                                            <CardTitle className="text-lg">
                                                {meeting.title}
                                            </CardTitle>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {formatDate(meeting.meeting_date)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    {formatTime(meeting.start_time)} -{' '}
                                                    {formatTime(meeting.end_time)}
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
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(meeting)}
                                                disabled={processing}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => confirmDelete(meeting)}
                                                disabled={processing}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {meeting.items.length === 0 ? (
                                        <p className="py-4 text-center text-sm text-muted-foreground">
                                            Belum ada item pembahasan.
                                        </p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">No</TableHead>
                                                    <TableHead className="w-40">Subject</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Action</TableHead>
                                                    <TableHead>Objectives</TableHead>
                                                    <TableHead className="w-28">Date Start</TableHead>
                                                    <TableHead className="w-28">Date Finish</TableHead>
                                                    <TableHead className="w-32">PIC</TableHead>
                                                    <TableHead className="w-28">Status</TableHead>
                                                    <TableHead>Remarks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {meeting.items.map((item, idx) => (
                                                    <TableRow key={item.id ?? idx}>
                                                        <TableCell className="text-muted-foreground">
                                                            {idx + 1}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {item.subject}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground max-w-48 truncate">
                                                            {item.description ?? '-'}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground max-w-48 truncate">
                                                            {item.action ?? '-'}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground max-w-48 truncate">
                                                            {item.objectives ?? '-'}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {item.date_start ?? '-'}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {item.date_finish ?? '-'}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {item.pic ?? '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={statusVariant(item.status)}
                                                            >
                                                                {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] ??
                                                                    item.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground max-w-48 truncate">
                                                            {item.remarks ?? '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
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
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
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
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Rapat Pengendalian EBITDA ..."
                                />
                                {errors.title && (
                                    <p className="text-sm text-destructive">{errors.title}</p>
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
                                    onChange={(e) => setData('location', e.target.value)}
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
                                    <Plus className="mr-1 h-3 w-3" /> Tambah Item
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
                                                    onClick={() => removeItem(index)}
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
                                                {errors[`items.${index}.subject`] && (
                                                    <p className="text-xs text-destructive">
                                                        {errors[`items.${index}.subject`]}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label>Description</Label>
                                                <textarea
                                                    value={item.description ?? ''}
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
                                                    value={item.objectives ?? ''}
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
                                                    value={item.date_start ?? ''}
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
                                                    value={item.date_finish ?? ''}
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
                                                                        STATUS_LABELS[s]
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
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Minutes of Meeting</DialogTitle>
                        <DialogDescription>
                            Anda akan menghapus "{deleteTarget?.title}". Semua
                            item pembahasan juga akan terhapus. Tindakan ini
                            tidak dapat dibatalkan.
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
