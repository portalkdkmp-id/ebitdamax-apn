import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    AlertTriangle,
    CalendarDays,
    Clock3,
    MapPin,
    Save,
    Store,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import KdkmpFinancialMatrixChart from '@/components/monitoring/KdkmpFinancialMatrixChart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    kdkmpDashboardFields,
    kdkmpPlanRevenueCategories,
} from '@/lib/kdkmp-dashboard-fields';
import {
    emptyKdkmpOperationalAttendance,
    kdkmpOperationalAttendanceRoles,
} from '@/lib/kdkmp-operational-attendance';
import { upsert } from '@/routes/kdkmp-dashboard';
import { save as saveOperationalAttendanceRoute } from '@/routes/kdkmp-dashboard/operational-attendance';
import type {
    KdkmpDailyEntry,
    KdkmpDashboardFields,
    KdkmpManagerDashboardProps,
    KdkmpOperationalAttendance,
    KdkmpPlanRevenueCategoryFields,
} from '@/types/kdkmp-dashboard';

type DailyForm = {
    actual_revenue: string;
    plan_cost: string;
} & {
    [Field in keyof KdkmpPlanRevenueCategoryFields]: string;
};

type OperationalAttendanceForm = {
    operational_attendance: KdkmpOperationalAttendance;
};

const ACTUAL_EBITDA_MARGIN_FIXED_COST = 9_172_133;
const TASK_COMPLETION_WEIGHT = 55;
const TIME_COMPLIANCE_WEIGHT = 30;
const REVENUE_WEIGHT = 15;

function inputValue(value: string | null | undefined): string {
    return value ?? '';
}

function formatRupiahInput(value: string): string {
    if (value === '') {
        return '';
    }

    if (value === '-') {
        return '-';
    }

    const isNegative = value.startsWith('-');
    const [integerPart, decimalPart] = value.replace(/^-/, '').split('.');
    const integerDigits = integerPart.replace(/\D/g, '') || '0';
    const formattedInteger = integerDigits.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        '.',
    );

    const formattedValue =
        decimalPart === undefined
            ? formattedInteger
            : `${formattedInteger},${decimalPart.slice(0, 2)}`;

    return isNegative ? `-${formattedValue}` : formattedValue;
}

function parseRupiahInput(value: string): string {
    const isNegative = value.trimStart().startsWith('-');
    const sanitized = value.replace(/[^\d,.]/g, '').replaceAll('.', '');
    const [integerPart, ...decimalParts] = sanitized.split(',');
    const integerDigits = integerPart
        .replace(/\D/g, '')
        .replace(/^0+(?=\d)/, '');
    const decimalDigits = decimalParts.join('').replace(/\D/g, '').slice(0, 2);

    if (integerDigits === '' && decimalDigits === '') {
        return isNegative ? '-' : '';
    }

    const prefix = isNegative ? '-' : '';

    if (sanitized.includes(',')) {
        return `${prefix}${integerDigits || '0'}.${decimalDigits}`;
    }

    return `${prefix}${integerDigits}`;
}

function RupiahInput({
    id,
    value,
    onValueChange,
}: {
    id: string;
    value: string;
    onValueChange: (value: string) => void;
}) {
    return (
        <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
            </span>
            <Input
                id={id}
                type="text"
                inputMode="decimal"
                value={formatRupiahInput(value)}
                onChange={(event) =>
                    onValueChange(parseRupiahInput(event.target.value))
                }
                className="pl-10"
                placeholder="0"
            />
        </div>
    );
}

function formDataFrom(entry: KdkmpDailyEntry | null): DailyForm {
    return {
        actual_revenue: inputValue(entry?.actual_revenue),
        plan_cost: inputValue(entry?.plan_cost),
        plan_revenue_makanan: inputValue(entry?.plan_revenue_makanan),
        plan_revenue_minuman: inputValue(entry?.plan_revenue_minuman),
        plan_revenue_rumahan: inputValue(entry?.plan_revenue_rumahan),
        plan_revenue_subsidi: inputValue(entry?.plan_revenue_subsidi),
        plan_revenue_expenses: inputValue(entry?.plan_revenue_expenses),
        plan_revenue_obat_obatan: inputValue(entry?.plan_revenue_obat_obatan),
    };
}

function operationalAttendanceFormDataFrom(
    entry: KdkmpDailyEntry | null,
): OperationalAttendanceForm {
    return {
        operational_attendance:
            entry?.operational_attendance ?? emptyKdkmpOperationalAttendance(),
    };
}

function hasCompletePlanRevenueBreakdown(data: DailyForm): boolean {
    return kdkmpPlanRevenueCategories.every(
        ({ key }) => data[key].trim() !== '',
    );
}

function calculatePlanRevenue(data: DailyForm): string {
    if (!hasCompletePlanRevenueBreakdown(data)) {
        return '';
    }

    const total = kdkmpPlanRevenueCategories.reduce(
        (sum, { key }) => sum + Number(data[key]),
        0,
    );

    return Number.isFinite(total)
        ? total
              .toFixed(2)
              .replace(/\.00$/, '')
              .replace(/(\.\d)0$/, '$1')
        : '';
}

function calculateActualEbitdaMargin(actualRevenue: string): string {
    if (actualRevenue.trim() === '') {
        return '';
    }

    const revenue = Number(actualRevenue);

    if (!Number.isFinite(revenue) || revenue === 0) {
        return '';
    }

    const margin =
        ((revenue - ACTUAL_EBITDA_MARGIN_FIXED_COST) / revenue) * 100;

    return `${margin
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1')}%`;
}

function calculatePerformanceScoring(
    planRevenue: string,
    actualRevenue: string,
    taskCompletionRate: number,
    timeComplianceRate: number,
): string {
    const clampPercentage = (value: number) =>
        Math.min(100, Math.max(0, value));
    const plan = Number(planRevenue);
    const actual = Number(actualRevenue);
    const revenueRate =
        planRevenue.trim() !== '' &&
        actualRevenue.trim() !== '' &&
        Number.isFinite(plan) &&
        Number.isFinite(actual) &&
        plan > 0
            ? clampPercentage((actual / plan) * 100)
            : 0;
    const score = clampPercentage(
        (clampPercentage(taskCompletionRate) * TASK_COMPLETION_WEIGHT) / 100 +
            (clampPercentage(timeComplianceRate) * TIME_COMPLIANCE_WEIGHT) /
                100 +
            (revenueRate * REVENUE_WEIGHT) / 100,
    );

    return `${score
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1')}%`;
}

function dashboardFieldValue(
    data: DailyForm,
    field: keyof KdkmpDashboardFields,
    computedValues: KdkmpManagerDashboardProps['computedValues'],
): string {
    if (field === 'target_revenue') {
        return inputValue(computedValues.target_revenue);
    }

    if (field === 'plan_revenue') {
        return calculatePlanRevenue(data);
    }

    if (field === 'actual_revenue' || field === 'plan_cost') {
        return data[field];
    }

    if (field === 'actual_ebitda_margin') {
        return calculateActualEbitdaMargin(data.actual_revenue);
    }

    if (field === 'performance_scoring') {
        return calculatePerformanceScoring(
            calculatePlanRevenue(data),
            data.actual_revenue,
            computedValues.task_completion_rate,
            computedValues.time_compliance_rate,
        );
    }

    return inputValue(computedValues[field]);
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function formatManualValue(value: string | null, isRupiah: boolean): string {
    if (value === null || value.trim() === '') {
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

export default function KdkmpDashboardIndex({
    businessDate,
    kdkmp,
    todayEntry,
    computedValues,
    financialMatrix,
    history,
}: KdkmpManagerDashboardProps) {
    const { data, setData, put, processing, errors } = useForm<DailyForm>(
        formDataFrom(todayEntry),
    );
    const {
        data: attendanceData,
        setData: setAttendanceData,
        put: putAttendance,
        processing: isSavingAttendance,
        errors: attendanceErrors,
    } = useForm<OperationalAttendanceForm>(
        operationalAttendanceFormDataFrom(todayEntry),
    );
    const [showLowPlanRevenueConfirmation, setShowLowPlanRevenueConfirmation] =
        useState(false);

    const save = () => {
        setShowLowPlanRevenueConfirmation(false);
        put(upsert.url(), { preserveScroll: true });
    };

    const saveOperationalAttendance = () => {
        putAttendance(saveOperationalAttendanceRoute.url(), {
            preserveScroll: true,
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const planRevenue = Number(calculatePlanRevenue(data));
        const targetRevenue = Number(computedValues.target_revenue);

        if (
            hasCompletePlanRevenueBreakdown(data) &&
            Number.isFinite(planRevenue) &&
            planRevenue < targetRevenue
        ) {
            setShowLowPlanRevenueConfirmation(true);

            return;
        }

        save();
    };

    const revenueFields = kdkmpDashboardFields.filter(
        (field) =>
            field.key === 'target_revenue' || field.key === 'actual_revenue',
    );
    const costFields = kdkmpDashboardFields.filter(
        (field) =>
            field.key === 'plan_cost' ||
            field.key === 'actual_cost' ||
            field.key === 'actual_ebitda_margin',
    );
    const performanceFields = kdkmpDashboardFields.filter(
        (field) =>
            field.key === 'total_duration' ||
            field.key === 'performance_scoring',
    );

    const renderDashboardField = (
        field: (typeof kdkmpDashboardFields)[number],
    ) => {
        const editableField =
            field.key === 'actual_revenue' || field.key === 'plan_cost'
                ? field.key
                : null;
        const fieldValue = dashboardFieldValue(data, field.key, computedValues);

        return (
            <div key={field.key} className="space-y-2">
                <Label htmlFor={field.isDisabled ? undefined : field.key}>
                    {field.label}
                </Label>
                {field.isDisabled ? (
                    <p className="py-2 text-sm font-semibold text-foreground tabular-nums">
                        {formatManualValue(fieldValue, field.isRupiah === true)}
                    </p>
                ) : field.isRupiah ? (
                    <RupiahInput
                        id={field.key}
                        value={fieldValue}
                        onValueChange={(value) => {
                            if (editableField) {
                                setData(editableField, value);
                            }
                        }}
                    />
                ) : null}
                {field.description && (
                    <p className="text-xs text-muted-foreground">
                        {field.description}
                    </p>
                )}
                <InputError
                    message={editableField ? errors[editableField] : undefined}
                />
            </div>
        );
    };

    return (
        <>
            <Head title="Dashboard KDKMP" />

            <div className="min-h-screen bg-background p-4 sm:p-6">
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-sm font-medium tracking-wide text-primary uppercase">
                            Laporan Harian
                        </p>
                        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    Dashboard EBITDAMAX KDKMP
                                </h1>
                                <p className="mt-2 text-muted-foreground">
                                    Isi pencapaian harian KDKMP. Setiap data
                                    yang disimpan langsung berstatus lengkap.
                                </p>
                            </div>
                            <EntryStatus entry={todayEntry} />
                        </div>
                    </div>

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

                            <KdkmpFinancialMatrixChart
                                matrix={financialMatrix}
                            />

                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle>Input Data Hari Ini</CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <form
                                        onSubmit={submit}
                                        className="space-y-6"
                                    >
                                        <div className="grid gap-6 lg:grid-cols-2">
                                            <section className="space-y-5 rounded-lg border bg-muted/20 p-4">
                                                <div>
                                                    <h2 className="font-semibold text-foreground">
                                                        Revenue
                                                    </h2>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        Rencana dan realisasi
                                                        pendapatan harian KDKMP.
                                                    </p>
                                                </div>

                                                <div className="grid gap-5 md:grid-cols-2">
                                                    {revenueFields.map(
                                                        renderDashboardField,
                                                    )}
                                                </div>

                                                <div className="space-y-4 border-t pt-5">
                                                    <div>
                                                        <h3 className="font-medium text-foreground">
                                                            Breakdown Plan
                                                            Revenue
                                                        </h3>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            Isi seluruh
                                                            kategori. Nilai 0
                                                            diperbolehkan dan
                                                            ikut dihitung dalam
                                                            total Plan Revenue.
                                                        </p>
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        {kdkmpPlanRevenueCategories.map(
                                                            (category) => (
                                                                <div
                                                                    key={
                                                                        category.key
                                                                    }
                                                                    className="space-y-2"
                                                                >
                                                                    <Label
                                                                        htmlFor={
                                                                            category.key
                                                                        }
                                                                    >
                                                                        {
                                                                            category.label
                                                                        }
                                                                    </Label>
                                                                    <RupiahInput
                                                                        id={
                                                                            category.key
                                                                        }
                                                                        value={
                                                                            data[
                                                                                category
                                                                                    .key
                                                                            ]
                                                                        }
                                                                        onValueChange={(
                                                                            value,
                                                                        ) =>
                                                                            setData(
                                                                                category.key,
                                                                                value,
                                                                            )
                                                                        }
                                                                    />
                                                                    <InputError
                                                                        message={
                                                                            errors[
                                                                                category
                                                                                    .key
                                                                            ]
                                                                        }
                                                                    />
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-1 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <p className="text-sm font-medium text-foreground">
                                                            Total Plan Revenue
                                                        </p>
                                                        <p className="text-lg font-bold text-primary tabular-nums">
                                                            {formatManualValue(
                                                                calculatePlanRevenue(
                                                                    data,
                                                                ) || null,
                                                                true,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </section>

                                            <section className="space-y-5 rounded-lg border bg-muted/20 p-4">
                                                <div>
                                                    <h2 className="font-semibold text-foreground">
                                                        Cost
                                                    </h2>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        Target biaya serta
                                                        pencapaian biaya harian
                                                        KDKMP.
                                                    </p>
                                                </div>

                                                <div className="grid gap-5 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>
                                                            Target Cost
                                                        </Label>
                                                        <p className="py-2 text-sm font-semibold text-foreground tabular-nums">
                                                            Rp9.172.133
                                                        </p>
                                                    </div>
                                                    {costFields.map(
                                                        renderDashboardField,
                                                    )}
                                                    <div className="space-y-2">
                                                        <Label>
                                                            Target EBITDA Margin
                                                            % (Tahun)
                                                        </Label>
                                                        <p className="py-2 text-sm font-semibold text-foreground tabular-nums">
                                                            12.61%
                                                        </p>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>

                                        <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
                                            <div>
                                                <h2 className="font-semibold text-foreground">
                                                    Kinerja Operasional
                                                </h2>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Ringkasan penyelesaian task
                                                    dan penilaian performa hari
                                                    ini.
                                                </p>
                                            </div>
                                            <div className="grid gap-5 md:grid-cols-2">
                                                {performanceFields.map(
                                                    renderDashboardField,
                                                )}
                                            </div>

                                            <div className="space-y-4 border-t pt-5">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <h3 className="font-medium text-foreground">
                                                            Anggota yang masuk
                                                            (Jumlah Anggota)
                                                        </h3>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            Simpan kehadiran
                                                            operasional sebelum
                                                            memulai task.
                                                        </p>
                                                    </div>
                                                    <div className="rounded-md border bg-background px-3 py-2 text-sm">
                                                        <span className="text-muted-foreground">
                                                            Jam
                                                            Operasional:{' '}
                                                        </span>
                                                        <span className="font-semibold text-foreground">
                                                            08:00 - 17:00
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                                    {kdkmpOperationalAttendanceRoles.map(
                                                        (role) => (
                                                            <div
                                                                key={role.key}
                                                                className="space-y-2"
                                                            >
                                                                <Label
                                                                    htmlFor={`operational-attendance-${role.key}`}
                                                                >
                                                                    {role.label}
                                                                </Label>
                                                                <Input
                                                                    id={`operational-attendance-${role.key}`}
                                                                    type="number"
                                                                    inputMode="numeric"
                                                                    min="0"
                                                                    step="1"
                                                                    value={
                                                                        attendanceData
                                                                            .operational_attendance[
                                                                            role
                                                                                .key
                                                                        ]
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) => {
                                                                        const value =
                                                                            Math.max(
                                                                                0,
                                                                                Math.floor(
                                                                                    Number(
                                                                                        event
                                                                                            .target
                                                                                            .value,
                                                                                    ) ||
                                                                                        0,
                                                                                ),
                                                                            );

                                                                        setAttendanceData(
                                                                            'operational_attendance',
                                                                            {
                                                                                ...attendanceData.operational_attendance,
                                                                                [role.key]:
                                                                                    value,
                                                                            },
                                                                        );
                                                                    }}
                                                                />
                                                                <InputError
                                                                    message={
                                                                        attendanceErrors[
                                                                            `operational_attendance.${role.key}`
                                                                        ]
                                                                    }
                                                                />
                                                            </div>
                                                        ),
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <p className="text-sm text-muted-foreground">
                                                        {todayEntry?.operational_attendance_saved_at
                                                            ? 'Kehadiran hari ini sudah disimpan dan dapat diperbarui.'
                                                            : 'Kehadiran hari ini belum disimpan.'}
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        onClick={
                                                            saveOperationalAttendance
                                                        }
                                                        disabled={
                                                            isSavingAttendance
                                                        }
                                                    >
                                                        <Save className="size-4" />
                                                        {isSavingAttendance
                                                            ? 'Menyimpan Kehadiran...'
                                                            : 'Simpan Kehadiran'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Keenam kategori Plan Revenue
                                                wajib diisi. Nilai 0 tetap
                                                dianggap sebagai data valid.
                                            </p>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                <Save className="size-4" />
                                                {processing
                                                    ? 'Menyimpan...'
                                                    : 'Simpan Data Hari Ini'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Clock3 className="size-5" />
                                Riwayat Harian
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-5">
                            <div className="overflow-x-auto">
                                <Table className="min-w-[2700px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            {kdkmpDashboardFields.map(
                                                (field) => (
                                                    <TableHead key={field.key}>
                                                        {field.label}
                                                    </TableHead>
                                                ),
                                            )}
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={
                                                        kdkmpDashboardFields.length +
                                                        2
                                                    }
                                                    className="py-8 text-center text-muted-foreground"
                                                >
                                                    Belum ada riwayat laporan
                                                    harian.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {history.data.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="font-medium">
                                                    {formatDate(
                                                        entry.report_date,
                                                    )}
                                                </TableCell>
                                                {kdkmpDashboardFields.map(
                                                    (field) => (
                                                        <TableCell
                                                            key={field.key}
                                                            className="tabular-nums"
                                                        >
                                                            {formatManualValue(
                                                                entry[
                                                                    field.key
                                                                ],
                                                                field.isRupiah ===
                                                                    true,
                                                            )}
                                                        </TableCell>
                                                    ),
                                                )}
                                                <TableCell>
                                                    <EntryStatus
                                                        entry={entry}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {history.last_page > 1 && (
                                <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                    <p>
                                        Menampilkan {history.from ?? 0}-
                                        {history.to ?? 0} dari {history.total}{' '}
                                        riwayat
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {history.links.map((link) => (
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
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog
                open={showLowPlanRevenueConfirmation}
                onOpenChange={setShowLowPlanRevenueConfirmation}
            >
                <DialogContent>
                    <DialogHeader>
                        <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                            <AlertTriangle className="size-5" />
                        </div>
                        <DialogTitle>Konfirmasi Plan Revenue</DialogTitle>
                        <DialogDescription>
                            Plan Revenue yang dimasukkan adalah{' '}
                            <span className="font-semibold text-foreground">
                                {formatManualValue(
                                    calculatePlanRevenue(data),
                                    true,
                                )}
                            </span>
                            , lebih rendah dari Target Revenue{' '}
                            <span className="font-semibold text-foreground">
                                {formatManualValue(
                                    computedValues.target_revenue,
                                    true,
                                )}
                            </span>
                            . Data ini akan ditandai untuk direview oleh
                            superadmin.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setShowLowPlanRevenueConfirmation(false)
                            }
                        >
                            Periksa Kembali
                        </Button>
                        <Button
                            type="button"
                            onClick={save}
                            disabled={processing}
                        >
                            Setujui & Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
