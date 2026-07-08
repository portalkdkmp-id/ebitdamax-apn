import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    ChevronRight,
    Clock,
    Construction,
    FileWarning,
    Map,
    ShieldCheck,
    Users,
} from 'lucide-react';
import IndicatorBarChart from '@/components/monitoring/IndicatorBarChart';
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

const TONE_BAR: Record<Tone, string> = {
    default: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-destructive',
    neutral: 'bg-slate-400',
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

type FunnelStage = {
    label: string;
    value: number;
    tone: Tone;
};

function VerificationFunnel({
    total,
    stages,
}: {
    total: number;
    stages: FunnelStage[];
}) {
    return (
        <Card className="shadow-sm">
            <CardContent className="space-y-4 p-5">
                <p className="text-sm font-medium text-muted-foreground">
                    Alur verifikasi dan pembangunan lahan
                </p>

                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                    {stages.map((stage) => (
                        <div
                            key={stage.label}
                            className={`h-full ${TONE_BAR[stage.tone]}`}
                            style={{
                                width: `${total > 0 ? (stage.value / total) * 100 : 0}%`,
                            }}
                        />
                    ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {stages.map((stage) => {
                        const percent =
                            total > 0
                                ? Math.round((stage.value / total) * 1000) / 10
                                : 0;

                        return (
                            <div
                                key={stage.label}
                                className="flex items-start gap-2"
                            >
                                <span
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_BAR[stage.tone]}`}
                                />
                                <div>
                                    <p className="text-sm font-semibold tabular-nums">
                                        {formatNumber(stage.value)}{' '}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            ({percent}%)
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {stage.label}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default function MonitoringIndex({
    sarpras,
    pemetaan_lahan: pemetaanLahan,
    sdm,
}: MonitoringDashboardProps) {
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
                                    title="KDKMP Sarpras Esensial Lengkap"
                                    value={
                                        sarpras.data.data
                                            .jumlah_koperasi_sarpras_mandatory_lengkap
                                    }
                                    icon={CheckCircle2}
                                    tone="success"
                                />
                                <StatCard
                                    title="KDKMP Sarpras Sekunder Lengkap"
                                    value={
                                        sarpras.data.data
                                            .jumlah_koperasi_sarpras_secondary_lengkap
                                    }
                                    icon={Building2}
                                    tone="default"
                                />
                                <StatCard
                                    title="KDKMP Sarpras Lengkap Semua"
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
                                        label: 'Sarpras Esensial Lengkap',
                                        value: sarpras.data.data
                                            .jumlah_koperasi_sarpras_mandatory_lengkap,
                                        tone: 'success',
                                    },
                                    {
                                        label: 'Sarpras Sekunder Lengkap',
                                        value: sarpras.data.data
                                            .jumlah_koperasi_sarpras_secondary_lengkap,
                                        tone: 'default',
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
                                Esensial: sarpras wajib operasional (saat ini{' '}
                                {sarpras.data.meta.mandatory_requirement_count}{' '}
                                jenis). Sekunder: sarpras tambahan (saat ini{' '}
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
                            icon={Map}
                            title="Pemetaan & Validasi Lahan"
                            tone="default"
                            updatedAt={pemetaanLahan.fetched_at}
                        />

                        {pemetaanLahan.status === 'error' || !lahan ? (
                            <SectionUnavailable label="pemetaan lahan" />
                        ) : (
                            <div className="space-y-4">
                                <VerificationFunnel
                                    total={lahan.total}
                                    stages={[
                                        {
                                            label: 'Terverifikasi belum bangun',
                                            value: lahan.terverifikasi_belum_bangun,
                                            tone: 'default',
                                        },
                                        {
                                            label: 'Mulai dibangun',
                                            value: lahan.mulai_dibangun,
                                            tone: 'warning',
                                        },
                                        {
                                            label: 'Pembangunan 100%',
                                            value: lahan.done_pembangunan,
                                            tone: 'success',
                                        },
                                        {
                                            label: 'Belum terverifikasi (proses lain)',
                                            value: Math.max(
                                                lahan.total -
                                                    lahan.terverifikasi_belum_bangun -
                                                    lahan.mulai_dibangun -
                                                    lahan.done_pembangunan,
                                                0,
                                            ),
                                            tone: 'neutral',
                                        },
                                    ]}
                                />

                                <div>
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                                        Status verifikasi
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <StatCard
                                            title="Lahan Diajukan"
                                            value={lahan.total}
                                            icon={FileWarning}
                                            tone="default"
                                        />
                                        <StatCard
                                            title="Sedang Diverifikasi"
                                            value={lahan.sedang_diverifikasi}
                                            icon={Clock}
                                            tone="warning"
                                        />
                                        <StatCard
                                            title="Terverifikasi"
                                            value={lahan.terverifikasi}
                                            icon={CheckCircle2}
                                            tone="success"
                                        />
                                        <StatCard
                                            title="Dipertimbangkan / Catatan"
                                            value={
                                                lahan.dipertimbangkan_catatan
                                            }
                                            icon={AlertTriangle}
                                            tone="default"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                                        Detail lain
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <StatCard
                                            title="Diberikan Catatan"
                                            value={lahan.catatan}
                                            icon={AlertTriangle}
                                            tone="default"
                                        />
                                        <StatCard
                                            title="Perlu Verifikasi Lanjutan"
                                            value={
                                                lahan.perlu_verifikasi_lanjutan
                                            }
                                            icon={Clock}
                                            tone="warning"
                                        />
                                        <StatCard
                                            title="Luas Lahan < 15x20"
                                            value={lahan.luaslahan_15_20}
                                            icon={AlertTriangle}
                                            tone="warning"
                                        />
                                        <StatCard
                                            title="Lahan LP2B"
                                            value={lahan.lp2b}
                                            icon={AlertTriangle}
                                            tone="danger"
                                        />
                                    </div>
                                </div>

                                <IndicatorBarChart
                                    title="Perbandingan Seluruh Indikator Lahan"
                                    data={[
                                        {
                                            label: 'Lahan Diajukan',
                                            value: lahan.total,
                                            tone: 'default',
                                        },
                                        {
                                            label: 'Sedang Diverifikasi',
                                            value: lahan.sedang_diverifikasi,
                                            tone: 'warning',
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
                                            label: 'Mulai Dibangun',
                                            value: lahan.mulai_dibangun,
                                            tone: 'warning',
                                        },
                                        {
                                            label: 'Pembangunan 100%',
                                            value: lahan.done_pembangunan,
                                            tone: 'success',
                                        },
                                        {
                                            label: 'Dipertimbangkan / Catatan',
                                            value: lahan.dipertimbangkan_catatan,
                                            tone: 'default',
                                        },
                                        {
                                            label: 'Diberikan Catatan',
                                            value: lahan.catatan,
                                            tone: 'default',
                                        },
                                        {
                                            label: 'Perlu Verifikasi Lanjutan',
                                            value: lahan.perlu_verifikasi_lanjutan,
                                            tone: 'warning',
                                        },
                                        {
                                            label: 'Luas Lahan < 15x20',
                                            value: lahan.luaslahan_15_20,
                                            tone: 'warning',
                                        },
                                        {
                                            label: 'Lahan LP2B',
                                            value: lahan.lp2b,
                                            tone: 'danger',
                                        },
                                    ]}
                                />
                            </div>
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
                                title="KDKMP Sudah Ditambahkan Karyawan"
                                value={sdm.jumlah_kdkmp_ditambahkan}
                                icon={Building2}
                                tone="success"
                            />
                            <StatCard
                                title="Total Karyawan Ditempatkan"
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
                            title="Data Odoo"
                            tone="default"
                            action={
                                <Badge
                                    variant="outline"
                                    className="ml-auto text-xs"
                                >
                                    Coming soon
                                </Badge>
                            }
                        />
                        <Card className="border-l-4 border-dashed border-l-muted-foreground/40">
                            <CardContent className="p-5 text-sm text-muted-foreground">
                                PO, penerimaan barang, dan penjualan per KDKMP,
                                dalam proses pembuatan.
                            </CardContent>
                        </Card>
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
