import { Head, Link, usePoll } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Boxes,
    Building2,
    CheckCircle2,
    ChevronRight,
    Clock,
    Construction,
    FileWarning,
    Layers,
    Map,
    Package,
    Percent,
    ShieldCheck,
    Tag,
    TrendingUp,
    Users,
} from 'lucide-react';
import IndicatorBarChart from '@/components/monitoring/IndicatorBarChart';
import KdkmpSkuDistributionChart from '@/components/monitoring/KdkmpSkuDistributionChart';
import KoperasiMap from '@/components/monitoring/KoperasiMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { index as monitoringIndex } from '@/routes/monitoring';
import { index as sdmDataIndex } from '@/routes/sdm-data';
import type { MonitoringDashboardProps } from '@/types/monitoring';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_TEXT: Record<Tone, string> = {
    default: 'text-primary',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-destructive',
    neutral: 'text-slate-500',
};

const TONE_BG: Record<Tone, string> = {
    default: 'bg-primary/10',
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    danger: 'bg-destructive/10',
    neutral: 'bg-slate-500/10',
};

const TONE_BORDER: Record<Tone, string> = {
    default: 'border-l-primary',
    success: 'border-l-emerald-500',
    warning: 'border-l-amber-500',
    danger: 'border-l-destructive',
    neutral: 'border-l-slate-400',
};

function formatNumber(value: number) {
    return value.toLocaleString('id-ID');
}

function SectionHeading({
    icon: Icon,
    title,
    tone,
    updatedAt,
    action,
}: {
    icon: React.ElementType;
    title: string;
    tone: Tone;
    updatedAt?: string | null;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-3">
            <div
                className={`rounded-lg p-2 ${TONE_BG[tone]} ${TONE_TEXT[tone]}`}
            >
                <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {updatedAt && (
                <Badge
                    variant="outline"
                    className="ml-auto text-xs font-normal"
                >
                    Update {new Date(updatedAt).toLocaleString('id-ID')}
                </Badge>
            )}
            {action}
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    tone = 'default',
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    tone?: Tone;
}) {
    return (
        <Card className={`border-l-4 bg-card shadow-sm ${TONE_BORDER[tone]}`}>
            <CardContent className="flex items-center justify-between p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                        {formatNumber(value)}
                    </p>
                </div>
                <div
                    className={`rounded-full p-3 ${TONE_BG[tone]} ${TONE_TEXT[tone]}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}

function SectionUnavailable({ label }: { label: string }) {
    return (
        <Card className="border-l-4 border-dashed border-l-amber-500">
            <CardContent className="flex items-center gap-3 p-5 text-muted-foreground">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm">
                    Gagal mengambil data {label}. Portal sumber mungkin sedang
                    tidak dapat diakses, coba muat ulang halaman ini.
                </p>
            </CardContent>
        </Card>
    );
}

function formatPercent(value: number) {
    return `${value.toLocaleString('id-ID', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    })}%`;
}

function AvailabilityBar({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: number;
    tone?: Tone;
}) {
    const clamped = Math.max(0, Math.min(100, value));

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{label}</span>
                <span className={`tabular-nums ${TONE_TEXT[tone]}`}>
                    {formatPercent(clamped)}
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={`h-full rounded-full ${TONE_BG[tone]}`}
                    style={{
                        width: `${clamped}%`,
                        backgroundColor:
                            tone === 'success'
                                ? '#059669'
                                : tone === 'warning'
                                  ? '#d97706'
                                  : tone === 'danger'
                                    ? '#dc2626'
                                    : tone === 'neutral'
                                      ? '#94a3b8'
                                      : '#2563eb',
                    }}
                />
            </div>
        </div>
    );
}

function AvailabilityBreakdown({
    availability,
}: {
    availability: {
        gerai: number;
        kabupaten: number;
        provinsi: number;
        nasional: number;
    };
}) {
    const toneFor = (value: number): Tone => {
        if (value >= 90) {
            return 'success';
        }

        if (value >= 70) {
            return 'warning';
        }

        return 'danger';
    };

    const levels: Array<{
        key: keyof typeof availability;
        label: string;
    }> = [
        { key: 'gerai', label: 'Gerai' },
        { key: 'kabupaten', label: 'Kabupaten / Kota' },
        { key: 'provinsi', label: 'Provinsi' },
        { key: 'nasional', label: 'Nasional' },
    ];

    return (
        <Card className="border bg-card shadow-sm">
            <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                        Availability per Level Wilayah
                    </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {levels.map((level) => (
                        <AvailabilityBar
                            key={level.key}
                            label={level.label}
                            value={availability[level.key]}
                            tone={toneFor(availability[level.key])}
                        />
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    Availability dihitung dari proporsi gerai KDKMP yang
                    memiliki SKU subsidi tersedia pada saat snapshot data
                    terakhir.
                </p>
            </CardContent>
        </Card>
    );
}

export default function MonitoringIndex({
    sarpras,
    pemetaan_lahan: pemetaanLahan,
    sdm,
    operasional_odoo: operasionalOdoo,
    stock,
    produk_subsidi: produkSubsidi,
}: MonitoringDashboardProps) {
    usePoll(30000);

    const lahan = pemetaanLahan.data?.stats;

    return (
        <>
            <Head title="Dashboard Monitoring KDKMP" />

            <div className="min-h-screen bg-background">
                <div className="space-y-8 p-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-sm font-medium tracking-wide text-primary uppercase">
                            Monitoring Progres
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-foreground">
                            Dashboard Monitoring KDKMP
                        </h1>
                        <p className="mt-2 max-w-4xl text-muted-foreground">
                            Rekap progres pembangunan, pemetaan lahan,
                            sarana-prasarana, dan SDM KDKMP, terintegrasi
                            langsung dengan portal pembangunan dan pemetaan
                            lahan.
                        </p>
                    </div>

                    <section className="space-y-3">
                        <SectionHeading
                            icon={Map}
                            title="Peta Sebaran KDKMP"
                            tone="default"
                        />
                        <KoperasiMap />
                    </section>

                    <section className="space-y-3">
                        <SectionHeading
                            icon={Map}
                            title="Pemetaan & Validasi Lahan"
                            tone="default"
                            updatedAt={pemetaanLahan.fetched_at}
                        />

                        {pemetaanLahan.status === 'error' || !lahan ? (
                            <SectionUnavailable label="pemetaan lahan" />
                        ) : (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                    <StatCard
                                        title="Lahan yang Diajukan"
                                        value={lahan.total}
                                        icon={FileWarning}
                                        tone="default"
                                    />
                                    <StatCard
                                        title="Terverifikasi"
                                        value={lahan.terverifikasi}
                                        icon={CheckCircle2}
                                        tone="success"
                                    />
                                    <StatCard
                                        title="Terverifikasi Belum Bangun"
                                        value={lahan.terverifikasi_belum_bangun}
                                        icon={Clock}
                                        tone="default"
                                    />
                                    <StatCard
                                        title="Pembangunan"
                                        value={lahan.mulai_dibangun}
                                        icon={Construction}
                                        tone="warning"
                                    />
                                    <StatCard
                                        title="Pembangunan 100%"
                                        value={lahan.done_pembangunan}
                                        icon={CheckCircle2}
                                        tone="success"
                                    />
                                </div>

                                <IndicatorBarChart
                                    title="Perbandingan Indikator Pemetaan Lahan"
                                    data={[
                                        {
                                            label: 'Lahan yang Diajukan',
                                            value: lahan.total,
                                            tone: 'default',
                                        },
                                        {
                                            label: 'Terverifikasi',
                                            value: lahan.terverifikasi,
                                            tone: 'success',
                                        },
                                        {
                                            label: 'Terverifikasi Belum Bangun',
                                            value: lahan.terverifikasi_belum_bangun,
                                            tone: 'default',
                                        },
                                        {
                                            label: 'Pembangunan',
                                            value: lahan.mulai_dibangun,
                                            tone: 'warning',
                                        },
                                        {
                                            label: 'Pembangunan 100%',
                                            value: lahan.done_pembangunan,
                                            tone: 'success',
                                        },
                                    ]}
                                />
                            </div>
                        )}
                    </section>

                    <section className="space-y-3">
                        <SectionHeading
                            icon={ShieldCheck}
                            title="Sarana & Prasarana"
                            tone="default"
                            updatedAt={sarpras.fetched_at}
                        />

                        {sarpras.status === 'error' || !sarpras.data ? (
                            <SectionUnavailable label="sarpras" />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-3">
                                <StatCard
                                    title="Sarpras Esensial 1 Lengkap"
                                    value={
                                        sarpras.data.data
                                            .jumlah_koperasi_sarpras_mandatory_lengkap
                                    }
                                    icon={CheckCircle2}
                                    tone="success"
                                />
                                <StatCard
                                    title="Sarpras Esensial 2 Lengkap"
                                    value={
                                        sarpras.data.data
                                            .jumlah_koperasi_sarpras_secondary_lengkap
                                    }
                                    icon={CheckCircle2}
                                    tone="success"
                                />
                                <StatCard
                                    title="Sarpras Lengkap Semua"
                                    value={
                                        sarpras.data.data
                                            .jumlah_koperasi_sarpras_lengkap_semua
                                    }
                                    icon={Building2}
                                    tone="default"
                                />
                            </div>
                        )}
                        {sarpras.status === 'ok' && sarpras.data && (
                            <IndicatorBarChart
                                title="Perbandingan Indikator Sarpras"
                                data={[
                                    {
                                        label: 'Sarpras Esensial 1 Lengkap',
                                        value: sarpras.data.data
                                            .jumlah_koperasi_sarpras_mandatory_lengkap,
                                        tone: 'success',
                                    },
                                    {
                                        label: 'Sarpras Esensial 2 Lengkap',
                                        value: sarpras.data.data
                                            .jumlah_koperasi_sarpras_secondary_lengkap,
                                        tone: 'success',
                                    },
                                    {
                                        label: 'Sarpras Lengkap Semua',
                                        value: sarpras.data.data
                                            .jumlah_koperasi_sarpras_lengkap_semua,
                                        tone: 'default',
                                    },
                                ]}
                            />
                        )}
                        {sarpras.status === 'ok' && sarpras.data && (
                            <p className="text-xs text-muted-foreground">
                                Esensial 1: sarpras wajib operasional (saat ini{' '}
                                {sarpras.data.meta.mandatory_requirement_count}{' '}
                                jenis). Esensial 2: sarpras tambahan (saat ini{' '}
                                {sarpras.data.meta.secondary_requirement_count}{' '}
                                jenis). Jumlah jenis mengikuti master data
                                sarpras terkini. Status dianggap selesai:{' '}
                                {sarpras.data.meta.completed_statuses.join(
                                    ', ',
                                )}
                                .
                            </p>
                        )}
                    </section>

                    <section className="space-y-3">
                        <SectionHeading
                            icon={Users}
                            title="Data SDM"
                            tone="default"
                            action={
                                <Button
                                    asChild
                                    variant="link"
                                    className="ml-auto h-auto p-0 text-sm font-medium"
                                >
                                    <Link href={sdmDataIndex()}>
                                        Kelola data SDM
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            }
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                            <StatCard
                                title="Jumlah KDKMP Sudah Ditambahkan Karyawan"
                                value={sdm.jumlah_kdkmp_ditambahkan}
                                icon={Building2}
                                tone="success"
                            />
                            <StatCard
                                title="Jumlah Karyawan Ditempatkan di KDKMP"
                                value={sdm.total_karyawan}
                                icon={Users}
                                tone="default"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Data diinput manual oleh tim HC.
                        </p>
                    </section>
                    <section className="space-y-3">
                        <SectionHeading
                            icon={Construction}
                            title="Operasional Odoo Lainnya"
                            tone="default"
                            updatedAt={operasionalOdoo.updated_at}
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                            <StatCard
                                title="KDKMP Sudah Dibuatkan PO"
                                value={operasionalOdoo.kdkmp_sudah_dibuatkan_po}
                                icon={Package}
                                tone="default"
                            />
                            <StatCard
                                title="KDKMP Sudah Melakukan Penerimaan Barang"
                                value={
                                    operasionalOdoo.kdkmp_sudah_penerimaan_barang
                                }
                                icon={CheckCircle2}
                                tone="success"
                            />
                            <StatCard
                                title="KDKMP Sudah Melakukan Penjualan"
                                value={operasionalOdoo.kdkmp_sudah_penjualan}
                                icon={Tag}
                                tone="warning"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Data dihitung dari {operasionalOdoo.total_kdkmp}{' '}
                            KDKMP hasil import Excel operasional. Kolom PO
                            menjadi indikator PO, Receipt menjadi penerimaan
                            barang, dan Sales menjadi penjualan.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <SectionHeading
                            icon={Package}
                            title="Stock & SKU"
                            tone="default"
                            action={
                                <Badge
                                    variant="outline"
                                    className="ml-auto text-xs"
                                >
                                    Dummy
                                </Badge>
                            }
                        />
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <StatCard
                                title="Jumlah SKU Terdaftar"
                                value={stock.jumlah_sku_terdaftar}
                                icon={Layers}
                                tone="default"
                            />
                            <StatCard
                                title="Jumlah SKU Aktif"
                                value={stock.jumlah_sku_aktif}
                                icon={Boxes}
                                tone="success"
                            />
                            <StatCard
                                title="Jumlah SKU Subsidi"
                                value={stock.jumlah_sku_subsidi}
                                icon={Tag}
                                tone="warning"
                            />
                            <StatCard
                                title="Rata-rata SKU per KDKMP"
                                value={stock.rata_rata_sku_per_kdkmp}
                                icon={TrendingUp}
                                tone="default"
                            />
                            <StatCard
                                title="MIN SKU di KDKMP"
                                value={stock.min_sku_kdkmp}
                                icon={ArrowDown}
                                tone="danger"
                            />
                            <StatCard
                                title="MAX SKU di KDKMP"
                                value={stock.max_sku_kdkmp}
                                icon={ArrowUp}
                                tone="success"
                            />
                        </div>
                        <IndicatorBarChart
                            title="Perbandingan Indikator SKU"
                            data={[
                                {
                                    label: 'Jumlah Total SKU',
                                    value: stock.jumlah_sku_terdaftar,
                                    tone: 'default',
                                },
                                {
                                    label: 'Jumlah SKU Aktif',
                                    value: stock.jumlah_sku_aktif,
                                    tone: 'success',
                                },
                                {
                                    label: 'Rata-rata SKU per KDKMP',
                                    value: stock.rata_rata_sku_per_kdkmp,
                                    tone: 'warning',
                                },
                            ]}
                        />
                        <p className="text-xs text-muted-foreground">
                            Data dihitung dari {stock.total_kdkmp} KDKMP hasil
                            snapshot master data SKU. SKU Terdaftar mencakup
                            seluruh SKU di master, SKU Aktif adalah yang
                            dipasarkan/dipasok, dan SKU Subsidi mengikuti
                            penandaan subsidi Odoo. Saat ini menggunakan data
                            dummy menunggu integrasi Odoo.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <SectionHeading
                            icon={Tag}
                            title="Distribusi SKU per KDKMP"
                            tone="default"
                            action={
                                <Badge
                                    variant="outline"
                                    className="ml-auto text-xs"
                                >
                                    Dummy
                                </Badge>
                            }
                        />
                        <KdkmpSkuDistributionChart
                            title="Jumlah SKU per KDKMP (urut SKU terkecil ke terbesar)"
                            description={`${stock.total_kdkmp} KDKMP, diurutkan menaik. Garis putus-putus menandai rata-rata ${stock.rata_rata_sku_per_kdkmp} SKU.`}
                            data={stock.distribusi_per_kdkmp}
                            average={stock.rata_rata_sku_per_kdkmp}
                        />
                        <p className="text-xs text-muted-foreground">
                            Setiap bar mewakili satu KDKMP. Hover untuk melihat
                            nama KDKMP dan jumlah SKU. Garis merah putus-putus
                            adalah rata-rata nasional untuk memudahkan
                            identifikasi KDKMP di atas/bawah rata-rata.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <SectionHeading
                            icon={Percent}
                            title="Availability Produk Subsidi"
                            tone="default"
                            action={
                                <Badge
                                    variant="outline"
                                    className="ml-auto text-xs"
                                >
                                    Dummy
                                </Badge>
                            }
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                            <StatCard
                                title="Availability Nasional"
                                value={produkSubsidi.availability.nasional}
                                icon={Percent}
                                tone={
                                    produkSubsidi.availability.nasional >= 90
                                        ? 'success'
                                        : produkSubsidi.availability.nasional >=
                                            70
                                          ? 'warning'
                                          : 'danger'
                                }
                            />
                            <Card
                                className={`border-l-4 bg-card shadow-sm ${TONE_BORDER['neutral']}`}
                            >
                                <CardContent className="flex items-center justify-between p-5">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Rasio Subsidi
                                        </p>
                                        <p className="mt-1 text-2xl font-bold tabular-nums">
                                            {formatPercent(
                                                stock.jumlah_sku_terdaftar > 0
                                                    ? (stock.jumlah_sku_subsidi /
                                                          stock.jumlah_sku_terdaftar) *
                                                          100
                                                    : 0,
                                            )}
                                        </p>
                                    </div>
                                    <div
                                        className={`rounded-full p-3 ${TONE_BG['warning']} ${TONE_TEXT['warning']}`}
                                    >
                                        <Tag className="h-5 w-5" />
                                    </div>
                                </CardContent>
                            </Card>
                            <StatCard
                                title="Kontribusi KDKMP"
                                value={stock.total_kdkmp}
                                icon={Building2}
                                tone="default"
                            />
                        </div>
                        <AvailabilityBreakdown
                            availability={produkSubsidi.availability}
                        />
                        <p className="text-xs text-muted-foreground">
                            Availability menunjukkan persentase gerai KDKMP
                            yang memiliki SKU subsidi tersedia pada saat
                            snapshot. Saat ini menggunakan data dummy menunggu
                            integrasi Odoo.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}

MonitoringIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Dashboard Monitoring',
            href: monitoringIndex(),
        },
    ],
};
