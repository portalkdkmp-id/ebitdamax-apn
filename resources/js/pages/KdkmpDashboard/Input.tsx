import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    MapPin,
    Store,
} from 'lucide-react';
import KdkmpDashboardDailyInputForm from '@/components/kdkmp-dashboard-daily-input-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { index as dashboardIndex } from '@/routes/kdkmp-dashboard';
import type {
    KdkmpComputedValues,
    KdkmpDailyEntry,
    KdkmpIdentity,
} from '@/types/kdkmp-dashboard';

type Props = {
    businessDate: string;
    kdkmp: KdkmpIdentity | null;
    todayEntry: KdkmpDailyEntry | null;
    computedValues: KdkmpComputedValues;
};

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function EntryStatus({ entry }: { entry: KdkmpDailyEntry | null }) {
    if (!entry) {
        return <Badge variant="outline">Belum diisi</Badge>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-600 text-white">Lengkap</Badge>
            {entry.plan_revenue_requires_review && (
                <Badge className="bg-rose-600 text-white">
                    Perlu review Plan Revenue
                </Badge>
            )}
        </div>
    );
}

export default function KdkmpDashboardInput({
    businessDate,
    kdkmp,
    todayEntry,
    computedValues,
}: Props) {
    return (
        <>
            <Head title="Input Data Hari Ini" />

            <main className="min-h-screen bg-background p-4 sm:p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <section className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                    >
                                        <Link href={dashboardIndex()}>
                                            <ArrowLeft className="size-4" />
                                            <span className="sr-only">
                                                Kembali ke Dashboard KDKMP
                                            </span>
                                        </Link>
                                    </Button>
                                    <p className="text-sm font-medium tracking-wide text-primary uppercase">
                                        Laporan Harian
                                    </p>
                                </div>
                                <h1 className="mt-2 text-2xl font-bold text-foreground">
                                    Input Data Hari Ini
                                </h1>
                                <p className="mt-2 text-muted-foreground">
                                    Isi pendapatan, biaya, dan kehadiran
                                    operasional KDKMP untuk hari ini.
                                </p>
                            </div>
                            <EntryStatus entry={todayEntry} />
                        </div>
                    </section>

                    {!kdkmp ? (
                        <Alert variant="destructive">
                            <Building2 />
                            <AlertTitle>Akun belum terhubung</AlertTitle>
                            <AlertDescription>
                                Akun Anda belum memiliki relasi ke data KDKMP.
                                Hubungi superadmin sebelum mengisi laporan
                                harian.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <div className="grid gap-4 lg:grid-cols-3">
                                <Card>
                                    <CardContent className="flex gap-3 p-5">
                                        <div className="h-fit rounded-full bg-primary/10 p-3 text-primary">
                                            <Store className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                KDKMP
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {kdkmp.name}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                NIK {kdkmp.nik ?? '-'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="flex gap-3 p-5">
                                        <div className="h-fit rounded-full bg-sky-500/10 p-3 text-sky-600">
                                            <MapPin className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Wilayah
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {kdkmp.desa ?? '-'},{' '}
                                                {kdkmp.kecamatan ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {kdkmp.kota_kabupaten ?? '-'},{' '}
                                                {kdkmp.provinsi ?? '-'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="flex gap-3 p-5">
                                        <div className="h-fit rounded-full bg-amber-500/10 p-3 text-amber-600">
                                            <CalendarDays className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Tanggal Laporan
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {formatDate(businessDate)}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Mengikuti waktu Asia/Jakarta
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <KdkmpDashboardDailyInputForm
                                businessDate={businessDate}
                                todayEntry={todayEntry}
                                computedValues={computedValues}
                                kdkmpId={kdkmp.id}
                            />
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
