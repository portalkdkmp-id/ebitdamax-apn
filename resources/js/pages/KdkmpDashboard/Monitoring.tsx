import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    CircleDashed,
    LockKeyhole,
    MapPinned,
    Search,
    Store,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import KdkmpMonthlyFinancialMatrixChart from '@/components/monitoring/KdkmpMonthlyFinancialMatrixChart';
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
import { kdkmpDashboardFields } from '@/lib/kdkmp-dashboard-fields';
import {
    index as monitoringIndex,
    tasks as monitoringTasks,
} from '@/routes/admin/kdkmp-dashboard';
import type {
    KdkmpMonitoringEntry,
    KdkmpMonitoringProps,
    KdkmpRegionOption,
} from '@/types/kdkmp-dashboard';

type MonitoringStatus = KdkmpMonitoringProps['filters']['status'];
type RegionOptionField = keyof KdkmpRegionOption;
type ConsolidationLevel = KdkmpMonitoringProps['consolidation']['level'];

const ALL_REGION_VALUE = '__all_regions__';

const consolidationLevelLabels: Record<ConsolidationLevel, string> = {
    national: 'Nasional',
    province: 'Provinsi',
    regency: 'Kabupaten/Kota',
    district: 'Kecamatan',
    village: 'Desa',
};

const consolidationLevelOrder: ConsolidationLevel[] = [
    'national',
    'province',
    'regency',
    'district',
    'village',
];

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

function formatRupiah(value: number | null): string {
    if (value === null) {
        return '-';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 2,
    }).format(value);
}

function uniqueSorted(values: string[]): string[] {
    return [...new Set(values)].sort((first, second) =>
        first.localeCompare(second, 'id'),
    );
}

function regionValues(
    regionOptions: KdkmpRegionOption[],
    field: RegionOptionField,
): string[] {
    return uniqueSorted(regionOptions.map((option) => option[field]));
}

function StatusBadge({
    entry,
}: {
    entry: KdkmpMonitoringEntry['daily_entry'];
}) {
    if (!entry) {
        return <Badge variant="outline">Belum diisi</Badge>;
    }

    return (
        <div className="flex flex-col items-start gap-2">
            <Badge className="bg-emerald-600 text-white">Lengkap</Badge>
            {entry.plan_revenue_requires_review && (
                <Badge className="bg-rose-600 text-white">
                    Review Plan Revenue
                </Badge>
            )}
        </div>
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

function LockedRegionValue({ value }: { value: string }) {
    return (
        <div className="flex min-h-9 items-center justify-between rounded-md border bg-muted/40 px-3 text-sm text-foreground">
            <span className="truncate">{value}</span>
            <LockKeyhole className="size-4 shrink-0 text-muted-foreground" />
        </div>
    );
}

function nextConsolidationLevel(
    level: ConsolidationLevel,
): ConsolidationLevel | null {
    const levelIndex = consolidationLevelOrder.indexOf(level);

    return consolidationLevelOrder[levelIndex + 1] ?? null;
}

function ConsolidationRegionCard({
    level,
    onClick,
    row,
}: {
    level: ConsolidationLevel;
    onClick: (() => void) | null;
    row: KdkmpMonitoringProps['consolidation']['rows'][number];
}) {
    const nextLevel = nextConsolidationLevel(level);
    const gapTone =
        row.gap === null
            ? 'text-muted-foreground'
            : row.gap < 0
              ? 'text-destructive'
              : 'text-emerald-600';
    const content = (
        <div
            className={`h-full rounded-xl border bg-card p-5 shadow-sm transition-all ${
                onClick
                    ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md'
                    : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {consolidationLevelLabels[level]}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">
                        {row.label}
                    </h3>
                </div>
                {onClick && (
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <ChevronRight className="size-4" />
                    </div>
                )}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <div>
                    <dt className="text-muted-foreground">KDKMP</dt>
                    <dd className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                        {row.total_kdkmp.toLocaleString('id-ID')}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Data Lengkap</dt>
                    <dd className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                        {row.complete_kdkmp.toLocaleString('id-ID')}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Plan Revenue</dt>
                    <dd className="mt-1 font-semibold text-foreground tabular-nums">
                        {formatRupiah(row.plan_revenue)}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Actual Revenue</dt>
                    <dd className="mt-1 font-semibold text-foreground tabular-nums">
                        {formatRupiah(row.actual_revenue)}
                    </dd>
                </div>
                <div className="col-span-2 border-t pt-3">
                    <dt className="text-muted-foreground">Gap</dt>
                    <dd
                        className={`mt-1 font-semibold tabular-nums ${gapTone}`}
                    >
                        {formatRupiah(row.gap)}
                    </dd>
                </div>
            </dl>

            <p className="mt-5 text-sm text-muted-foreground">
                {onClick
                    ? nextLevel
                        ? `Klik untuk melihat ${consolidationLevelLabels[nextLevel]}.`
                        : 'Klik untuk melihat grafik KDKMP.'
                    : 'KDKMP sedang dipilih.'}
            </p>
        </div>
    );

    if (!onClick) {
        return content;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="h-full w-full text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label={`Lihat ${nextLevel ? consolidationLevelLabels[nextLevel] : 'grafik KDKMP'} dari ${row.label}`}
        >
            {content}
        </button>
    );
}

export default function KdkmpDashboardMonitoring({
    businessDate,
    regionOptions,
    entries,
    summary,
    filters,
    regionalAccess,
    consolidation,
    selectedKdkmp,
    monthlyFinancialMatrix,
}: KdkmpMonitoringProps) {
    const [month, setMonth] = useState(filters.month);
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState<MonitoringStatus>(filters.status);
    const [provinsi, setProvinsi] = useState(
        filters.provinsi ?? regionalAccess.locked_filters.provinsi ?? '',
    );
    const [kotaKabupaten, setKotaKabupaten] = useState(
        filters.kota_kabupaten ??
            regionalAccess.locked_filters.kota_kabupaten ??
            '',
    );
    const [kecamatan, setKecamatan] = useState(
        filters.kecamatan ?? regionalAccess.locked_filters.kecamatan ?? '',
    );
    const [desa, setDesa] = useState(
        filters.desa ?? regionalAccess.locked_filters.desa ?? '',
    );
    const [consolidationLevel, setConsolidationLevel] = useState(
        consolidation.level,
    );

    const provinsiOptions = useMemo(
        () => regionValues(regionOptions, 'provinsi'),
        [regionOptions],
    );
    const kotaKabupatenOptions = useMemo(
        () =>
            regionValues(
                regionOptions.filter(
                    (option) => !provinsi || option.provinsi === provinsi,
                ),
                'kota_kabupaten',
            ),
        [provinsi, regionOptions],
    );
    const kecamatanOptions = useMemo(
        () =>
            regionValues(
                regionOptions.filter(
                    (option) =>
                        option.provinsi === provinsi &&
                        option.kota_kabupaten === kotaKabupaten,
                ),
                'kecamatan',
            ),
        [kotaKabupaten, provinsi, regionOptions],
    );
    const desaOptions = useMemo(
        () =>
            regionValues(
                regionOptions.filter(
                    (option) =>
                        option.provinsi === provinsi &&
                        option.kota_kabupaten === kotaKabupaten &&
                        option.kecamatan === kecamatan,
                ),
                'desa',
            ),
        [kecamatan, kotaKabupaten, provinsi, regionOptions],
    );

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            monitoringIndex.url(),
            {
                month,
                detail_date: filters.detail_date ?? '',
                search,
                status,
                consolidation_level: consolidationLevel,
                provinsi,
                kota_kabupaten: kotaKabupaten,
                kecamatan,
                desa,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const visitConsolidation = (
        level: ConsolidationLevel,
        region: {
            provinsi?: string | null;
            kota_kabupaten?: string | null;
            kecamatan?: string | null;
            desa?: string | null;
        } = {},
    ) => {
        const nextProvinsi =
            regionalAccess.locked_filters.provinsi ??
            region.provinsi ??
            provinsi;
        const nextKotaKabupaten =
            regionalAccess.locked_filters.kota_kabupaten ??
            region.kota_kabupaten ??
            kotaKabupaten;
        const nextKecamatan =
            regionalAccess.locked_filters.kecamatan ??
            region.kecamatan ??
            kecamatan;
        const nextDesa =
            regionalAccess.locked_filters.desa ?? region.desa ?? desa;

        setConsolidationLevel(level);
        setProvinsi(nextProvinsi);
        setKotaKabupaten(nextKotaKabupaten);
        setKecamatan(nextKecamatan);
        setDesa(nextDesa);

        router.get(
            monitoringIndex.url(),
            {
                month,
                detail_date: filters.detail_date ?? '',
                search,
                status,
                consolidation_level: level,
                provinsi: nextProvinsi,
                kota_kabupaten: nextKotaKabupaten,
                kecamatan: nextKecamatan,
                desa: nextDesa,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const selectDetailDate = (detailDate: string) => {
        router.get(
            monitoringIndex.url(),
            {
                month,
                detail_date: detailDate,
                search,
                status,
                consolidation_level: consolidationLevel,
                provinsi,
                kota_kabupaten: kotaKabupaten,
                kecamatan,
                desa,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const visitHierarchyLevel = (level: ConsolidationLevel) => {
        const currentProvinsi =
            level === 'national' || level === 'province' ? '' : provinsi;
        const currentKotaKabupaten =
            level === 'national' || level === 'province' || level === 'regency'
                ? ''
                : kotaKabupaten;
        const currentKecamatan = level === 'village' ? kecamatan : '';

        visitConsolidation(level, {
            provinsi: currentProvinsi,
            kota_kabupaten: currentKotaKabupaten,
            kecamatan: currentKecamatan,
            desa: '',
        });
    };

    const drillDown = (
        row: KdkmpMonitoringProps['consolidation']['rows'][number],
    ) => {
        if (consolidation.level === 'national') {
            visitConsolidation('province', {
                provinsi: regionalAccess.locked_filters.provinsi,
                kota_kabupaten: regionalAccess.locked_filters.kota_kabupaten,
                kecamatan: regionalAccess.locked_filters.kecamatan,
                desa: regionalAccess.locked_filters.desa ?? '',
            });

            return;
        }

        if (consolidation.level === 'province') {
            visitConsolidation('regency', {
                provinsi: row.provinsi,
                kota_kabupaten: regionalAccess.locked_filters.kota_kabupaten,
                kecamatan: regionalAccess.locked_filters.kecamatan,
                desa: regionalAccess.locked_filters.desa ?? '',
            });

            return;
        }

        if (consolidation.level === 'regency') {
            visitConsolidation('district', {
                provinsi: row.provinsi,
                kota_kabupaten: row.kota_kabupaten,
                kecamatan: regionalAccess.locked_filters.kecamatan,
                desa: regionalAccess.locked_filters.desa ?? '',
            });

            return;
        }

        if (consolidation.level === 'district') {
            visitConsolidation('village', {
                provinsi: row.provinsi,
                kota_kabupaten: row.kota_kabupaten,
                kecamatan: row.kecamatan,
                desa: regionalAccess.locked_filters.desa ?? '',
            });

            return;
        }

        if (consolidation.level === 'village') {
            visitConsolidation('village', {
                provinsi: row.provinsi,
                kota_kabupaten: row.kota_kabupaten,
                kecamatan: row.kecamatan,
                desa: row.desa,
            });
        }
    };

    const returnToVillageList = () => {
        visitConsolidation('village', {
            provinsi,
            kota_kabupaten: kotaKabupaten,
            kecamatan,
            desa: '',
        });
    };
    const visibleConsolidationLevels = regionalAccess.is_national
        ? consolidationLevelOrder
        : consolidationLevelOrder.filter((level) => level !== 'national');
    const currentConsolidationLevelIndex = visibleConsolidationLevels.indexOf(
        consolidation.level,
    );

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
                            Pantau pengisian dan pencapaian harian KDKMP sesuai
                            cakupan wilayah Anda.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                            <MapPinned className="size-4 text-primary" />
                            Cakupan akses:{' '}
                            <span className="font-medium text-foreground">
                                {regionalAccess.scope_label}
                            </span>
                        </div>
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
                            label="Belum Diisi"
                            value={summary.not_filled}
                            icon={<CircleDashed className="size-5" />}
                            tone="bg-slate-500/10 text-slate-600"
                        />
                        <SummaryCard
                            label="Plan Revenue Perlu Review"
                            value={summary.requires_review}
                            icon={<AlertTriangle className="size-5" />}
                            tone="bg-rose-500/10 text-rose-600"
                        />
                    </div>

                    <Card>
                        <CardContent className="space-y-5 p-5">
                            <div>
                                <h2 className="font-semibold text-foreground">
                                    Pohon EBITDA KDKMP
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Telusuri ringkasan EBITDA berdasarkan
                                    hierarki wilayah melalui kartu di bawah.
                                </p>
                            </div>

                            <nav
                                aria-label="Hierarki wilayah"
                                className="flex flex-wrap items-center gap-2 text-sm"
                            >
                                {visibleConsolidationLevels
                                    .slice(
                                        0,
                                        currentConsolidationLevelIndex + 1,
                                    )
                                    .map((level, index) => (
                                        <div
                                            key={level}
                                            className="flex items-center gap-2"
                                        >
                                            {index > 0 && (
                                                <ChevronRight className="size-4 text-muted-foreground" />
                                            )}
                                            {level === consolidation.level ? (
                                                <span
                                                    aria-current="page"
                                                    className="font-semibold text-foreground"
                                                >
                                                    {
                                                        consolidationLevelLabels[
                                                            level
                                                        ]
                                                    }
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        visitHierarchyLevel(
                                                            level,
                                                        )
                                                    }
                                                    className="text-primary hover:underline"
                                                >
                                                    {
                                                        consolidationLevelLabels[
                                                            level
                                                        ]
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    ))}
                            </nav>

                            {filters.desa !== null &&
                                !regionalAccess.locked_filters.desa && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={returnToVillageList}
                                    >
                                        Kembali ke daftar Desa
                                    </Button>
                                )}

                            {consolidation.rows.length === 0 ? (
                                <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Belum ada KDKMP pada cakupan wilayah ini.
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {consolidation.rows.map((row) => (
                                        <ConsolidationRegionCard
                                            key={row.key}
                                            level={consolidation.level}
                                            row={row}
                                            onClick={
                                                consolidation.level ===
                                                    'village' &&
                                                filters.desa === row.desa
                                                    ? null
                                                    : () => drillDown(row)
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="space-y-5 p-5">
                            <form
                                onSubmit={submitFilters}
                                className="space-y-5"
                            >
                                <div className="space-y-4 rounded-md border bg-muted/20 p-4">
                                    <div>
                                        <h2 className="font-medium text-foreground">
                                            Filter Wilayah
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Opsi di bawah mengikuti cakupan
                                            akses akun. Wilayah yang sudah
                                            ditentukan penugasan dikunci.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="space-y-2">
                                            <Label>Provinsi</Label>
                                            {regionalAccess.locked_filters
                                                .provinsi ? (
                                                <LockedRegionValue
                                                    value={
                                                        regionalAccess
                                                            .locked_filters
                                                            .provinsi
                                                    }
                                                />
                                            ) : (
                                                <Select
                                                    value={
                                                        provinsi ||
                                                        ALL_REGION_VALUE
                                                    }
                                                    onValueChange={(value) => {
                                                        setProvinsi(
                                                            value ===
                                                                ALL_REGION_VALUE
                                                                ? ''
                                                                : value,
                                                        );
                                                        setKotaKabupaten('');
                                                        setKecamatan('');
                                                        setDesa('');
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                ALL_REGION_VALUE
                                                            }
                                                        >
                                                            Semua provinsi
                                                        </SelectItem>
                                                        {provinsiOptions.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={option}
                                                                    value={
                                                                        option
                                                                    }
                                                                >
                                                                    {option}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Kota/Kabupaten</Label>
                                            {regionalAccess.locked_filters
                                                .kota_kabupaten ? (
                                                <LockedRegionValue
                                                    value={
                                                        regionalAccess
                                                            .locked_filters
                                                            .kota_kabupaten
                                                    }
                                                />
                                            ) : (
                                                <Select
                                                    disabled={!provinsi}
                                                    value={
                                                        kotaKabupaten ||
                                                        ALL_REGION_VALUE
                                                    }
                                                    onValueChange={(value) => {
                                                        setKotaKabupaten(
                                                            value ===
                                                                ALL_REGION_VALUE
                                                                ? ''
                                                                : value,
                                                        );
                                                        setKecamatan('');
                                                        setDesa('');
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                ALL_REGION_VALUE
                                                            }
                                                        >
                                                            Semua kota/kabupaten
                                                        </SelectItem>
                                                        {kotaKabupatenOptions.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={option}
                                                                    value={
                                                                        option
                                                                    }
                                                                >
                                                                    {option}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Kecamatan</Label>
                                            {regionalAccess.locked_filters
                                                .kecamatan ? (
                                                <LockedRegionValue
                                                    value={
                                                        regionalAccess
                                                            .locked_filters
                                                            .kecamatan
                                                    }
                                                />
                                            ) : (
                                                <Select
                                                    disabled={
                                                        !provinsi ||
                                                        !kotaKabupaten
                                                    }
                                                    value={
                                                        kecamatan ||
                                                        ALL_REGION_VALUE
                                                    }
                                                    onValueChange={(value) => {
                                                        setKecamatan(
                                                            value ===
                                                                ALL_REGION_VALUE
                                                                ? ''
                                                                : value,
                                                        );
                                                        setDesa('');
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                ALL_REGION_VALUE
                                                            }
                                                        >
                                                            Semua kecamatan
                                                        </SelectItem>
                                                        {kecamatanOptions.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={option}
                                                                    value={
                                                                        option
                                                                    }
                                                                >
                                                                    {option}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Desa</Label>
                                            {regionalAccess.locked_filters
                                                .desa ? (
                                                <LockedRegionValue
                                                    value={
                                                        regionalAccess
                                                            .locked_filters.desa
                                                    }
                                                />
                                            ) : (
                                                <Select
                                                    disabled={
                                                        !provinsi ||
                                                        !kotaKabupaten ||
                                                        !kecamatan
                                                    }
                                                    value={
                                                        desa || ALL_REGION_VALUE
                                                    }
                                                    onValueChange={(value) =>
                                                        setDesa(
                                                            value ===
                                                                ALL_REGION_VALUE
                                                                ? ''
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                ALL_REGION_VALUE
                                                            }
                                                        >
                                                            Semua desa
                                                        </SelectItem>
                                                        {desaOptions.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={option}
                                                                    value={
                                                                        option
                                                                    }
                                                                >
                                                                    {option}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[190px_220px_minmax(280px,1fr)_auto] xl:items-end">
                                    <div className="space-y-2">
                                        <Label htmlFor="monitoring-month">
                                            Bulan Grafik
                                        </Label>
                                        <Input
                                            id="monitoring-month"
                                            type="month"
                                            max={businessDate.slice(0, 7)}
                                            value={month}
                                            onChange={(event) =>
                                                setMonth(event.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Status Pengisian</Label>
                                        <Select
                                            value={status}
                                            onValueChange={(value) =>
                                                setStatus(
                                                    value as MonitoringStatus,
                                                )
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
                                                <SelectItem value="not_filled">
                                                    Belum diisi
                                                </SelectItem>
                                                <SelectItem value="requires_review">
                                                    Plan Revenue perlu review
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
                                                    setSearch(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Nama koperasi, NIK, manager, atau wilayah..."
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit">
                                        Terapkan Filter
                                    </Button>
                                </div>
                            </form>

                            {selectedKdkmp && monthlyFinancialMatrix ? (
                                <KdkmpMonthlyFinancialMatrixChart
                                    kdkmp={selectedKdkmp}
                                    matrix={monthlyFinancialMatrix}
                                    onDateClick={selectDetailDate}
                                />
                            ) : (
                                <div className="rounded-lg border border-dashed bg-muted/10 px-5 py-8 text-center text-sm text-muted-foreground">
                                    Lanjutkan Pohon EBITDA sampai memilih Desa
                                    untuk melihat grafik KDKMP.
                                </div>
                            )}

                            {selectedKdkmp && filters.detail_date ? (
                                <>
                                    <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                                        Menampilkan rincian KDKMP untuk{' '}
                                        <span className="font-medium text-foreground">
                                            {formatDate(filters.detail_date)}
                                        </span>
                                        .
                                    </div>

                                    <div className="overflow-x-auto">
                                        <Table className="min-w-[1900px]">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        KDKMP / Manager
                                                    </TableHead>
                                                    <TableHead>
                                                        Wilayah
                                                    </TableHead>
                                                    {kdkmpDashboardFields.map(
                                                        (field) => (
                                                            <TableHead
                                                                key={field.key}
                                                            >
                                                                {field.label}
                                                            </TableHead>
                                                        ),
                                                    )}
                                                    <TableHead>
                                                        Status
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Aksi
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {entries.data.length === 0 && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={
                                                                kdkmpDashboardFields.length +
                                                                4
                                                            }
                                                            className="py-10 text-center text-muted-foreground"
                                                        >
                                                            Tidak ada data yang
                                                            sesuai dengan
                                                            filter.
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
                                                                NIK{' '}
                                                                {entry.nik ??
                                                                    '-'}
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {entry.manager
                                                                    ?.email ??
                                                                    'Akun manager belum tersedia'}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <p>
                                                                {entry.desa ??
                                                                    '-'}
                                                                ,{' '}
                                                                {entry.kecamatan ??
                                                                    '-'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {entry.kota_kabupaten ??
                                                                    '-'}
                                                                ,{' '}
                                                                {entry.provinsi ??
                                                                    '-'}
                                                            </p>
                                                        </TableCell>
                                                        {kdkmpDashboardFields.map(
                                                            (field) => (
                                                                <TableCell
                                                                    key={
                                                                        field.key
                                                                    }
                                                                    className="tabular-nums"
                                                                >
                                                                    {formatManualValue(
                                                                        entry
                                                                            .daily_entry?.[
                                                                            field
                                                                                .key
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
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={
                                                                        !entry.manager
                                                                    }
                                                                    onClick={() => {
                                                                        if (
                                                                            !entry.manager
                                                                        ) {
                                                                            return;
                                                                        }

                                                                        if (
                                                                            entry
                                                                                .metrics
                                                                                .task_completion_rate <
                                                                            100
                                                                        ) {
                                                                            toast.error(
                                                                                'Task belum selesai semua atau belum ada.',
                                                                            );
                                                                            return;
                                                                        }

                                                                        router.get(
                                                                            monitoringTasks.url(
                                                                                {
                                                                                    kdkmpEntry:
                                                                                        entry.id,
                                                                                    date:
                                                                                        filters.detail_date ??
                                                                                        '',
                                                                                },
                                                                            ),
                                                                        );
                                                                    }}
                                                                >
                                                                    Lihat Task
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                        <p>
                                            Menampilkan {entries.from ?? 0}-
                                            {entries.to ?? 0} dari{' '}
                                            {entries.total} KDKMP
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
                                </>
                            ) : selectedKdkmp ? (
                                <div className="rounded-lg border border-dashed bg-muted/10 px-5 py-8 text-center text-sm text-muted-foreground">
                                    Klik salah satu tanggal pada grafik untuk
                                    melihat rincian KDKMP per hari.
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
