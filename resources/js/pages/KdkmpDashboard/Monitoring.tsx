import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleDashed,
    ClipboardList,
    Search,
    Store,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { kdkmpManualFields } from '@/lib/kdkmp-dashboard-fields';
import { index as monitoringIndex } from '@/routes/admin/kdkmp-dashboard';
import type {
    KdkmpMonitoringEntry,
    KdkmpMonitoringProps,
} from '@/types/kdkmp-dashboard';

type MonitoringStatus = KdkmpMonitoringProps['filters']['status'];

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function formatManualValue(
    value: string | null | undefined,
    isRupiah: boolean,
): string {
    if (value === null || value === undefined || value.trim() === '') {
        return '-';
    }

    if (!isRupiah || !/^-?\d+(\.\d{0,2})?$/.test(value)) {
        return value;
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 2,
    }).format(Number(value));
}

function StatusBadge({
    entry,
}: {
    entry: KdkmpMonitoringEntry['daily_entry'];
}) {
    if (!entry) {
        return <Badge variant="outline">Belum diisi</Badge>;
    }

    return entry.is_complete ? (
        <Badge className="bg-emerald-600 text-white">Lengkap</Badge>
    ) : (
        <Badge className="bg-amber-500 text-white">Draft</Badge>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    tone,
}: {
    label: string;
    value: number;
    icon: ReactNode;
    tone: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                        {value.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className={`rounded-full p-3 ${tone}`}>{icon}</div>
            </CardContent>
        </Card>
    );
}

export default function KdkmpDashboardMonitoring({
    businessDate,
    entries,
    summary,
    filters,
}: KdkmpMonitoringProps) {
    const [date, setDate] = useState(filters.date);
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState<MonitoringStatus>(filters.status);

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            monitoringIndex.url(),
            { date, search, status },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Monitoring Dashboard KDKMP" />

            <div className="min-h-screen bg-background p-4 sm:p-6">
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-sm font-medium tracking-wide text-primary uppercase">
                            Monitoring Harian
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-foreground">
                            Dashboard EBITDAMAX KDKMP
                        </h1>
                        <p className="mt-2 max-w-4xl text-muted-foreground">
                            Pantau pengisian dan pencapaian harian seluruh KDKMP
                            secara read-only.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            label="Total KDKMP Manager"
                            value={summary.total}
                            icon={<Store className="size-5" />}
                            tone="bg-primary/10 text-primary"
                        />
                        <SummaryCard
                            label="Data Lengkap"
                            value={summary.complete}
                            icon={<CheckCircle2 className="size-5" />}
                            tone="bg-emerald-500/10 text-emerald-600"
                        />
                        <SummaryCard
                            label="Masih Draft"
                            value={summary.draft}
                            icon={<ClipboardList className="size-5" />}
                            tone="bg-amber-500/10 text-amber-600"
                        />
                        <SummaryCard
                            label="Belum Diisi"
                            value={summary.not_filled}
                            icon={<CircleDashed className="size-5" />}
                            tone="bg-slate-500/10 text-slate-600"
                        />
                    </div>

                    <Card>
                        <CardContent className="space-y-5 p-5">
                            <form
                                onSubmit={submitFilters}
                                className="grid gap-4 md:grid-cols-2 xl:grid-cols-[190px_220px_minmax(280px,1fr)_auto] xl:items-end"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="monitoring-date">
                                        Tanggal
                                    </Label>
                                    <Input
                                        id="monitoring-date"
                                        type="date"
                                        max={businessDate}
                                        value={date}
                                        onChange={(event) =>
                                            setDate(event.target.value)
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Status Pengisian</Label>
                                    <Select
                                        value={status}
                                        onValueChange={(value) =>
                                            setStatus(value as MonitoringStatus)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua status
                                            </SelectItem>
                                            <SelectItem value="complete">
                                                Lengkap
                                            </SelectItem>
                                            <SelectItem value="draft">
                                                Draft
                                            </SelectItem>
                                            <SelectItem value="not_filled">
                                                Belum diisi
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="monitoring-search">
                                        Cari KDKMP
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="monitoring-search"
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Nama koperasi, NIK, manager, atau wilayah..."
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <Button type="submit">Terapkan Filter</Button>
                            </form>

                            <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                                Menampilkan data untuk{' '}
                                <span className="font-medium text-foreground">
                                    {formatDate(filters.date)}
                                </span>
                                .
                            </div>

                            <div className="overflow-x-auto">
                                <Table className="min-w-[3000px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                KDKMP / Manager
                                            </TableHead>
                                            <TableHead>Wilayah</TableHead>
                                            {kdkmpManualFields.map((field) => (
                                                <TableHead key={field.key}>
                                                    {field.label}
                                                </TableHead>
                                            ))}
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entries.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={
                                                        kdkmpManualFields.length +
                                                        3
                                                    }
                                                    className="py-10 text-center text-muted-foreground"
                                                >
                                                    Tidak ada data yang sesuai
                                                    dengan filter.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {entries.data.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell>
                                                    <p className="font-medium">
                                                        {entry.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        NIK {entry.nik ?? '-'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {entry.manager?.email ??
                                                            'Akun manager belum tersedia'}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <p>
                                                        {entry.desa ?? '-'},{' '}
                                                        {entry.kecamatan ?? '-'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {entry.kota_kabupaten ??
                                                            '-'}
                                                        ,{' '}
                                                        {entry.provinsi ?? '-'}
                                                    </p>
                                                </TableCell>
                                                {kdkmpManualFields.map(
                                                    (field) => (
                                                        <TableCell
                                                            key={field.key}
                                                            className="tabular-nums"
                                                        >
                                                            {formatManualValue(
                                                                entry
                                                                    .daily_entry?.[
                                                                    field.key
                                                                ],
                                                                field.isRupiah ===
                                                                    true,
                                                            )}
                                                        </TableCell>
                                                    ),
                                                )}
                                                <TableCell>
                                                    <StatusBadge
                                                        entry={
                                                            entry.daily_entry
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                <p>
                                    Menampilkan {entries.from ?? 0}-
                                    {entries.to ?? 0} dari {entries.total} KDKMP
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {entries.links.map((link) => (
                                        <Button
                                            key={`${link.label}-${link.url}`}
                                            type="button"
                                            size="sm"
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            disabled={!link.url}
                                            onClick={() => {
                                                if (link.url) {
                                                    router.get(
                                                        link.url,
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                        },
                                                    );
                                                }
                                            }}
                                        >
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
