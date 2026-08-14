import { useForm } from '@inertiajs/react';
import { AlertTriangle, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
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
    KdkmpComputedValues,
    KdkmpDailyEntry,
    KdkmpDashboardFields,
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

type Props = {
    businessDate: string;
    todayEntry: KdkmpDailyEntry | null;
    computedValues: KdkmpComputedValues;
    kdkmpId: number;
};

const ACTUAL_EBITDA_MARGIN_FIXED_COST = 9_172_133;
const TASK_COMPLETION_WEIGHT = 55;
const TIME_COMPLIANCE_WEIGHT = 30;
const REVENUE_WEIGHT = 15;
const POS_ACTUAL_REVENUE = '0';
const MANUAL_ACTUAL_REVENUE_STORAGE_PREFIX =
    'ebitdamax-kdkmp.manual-actual-revenue';

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

function isRevenueValue(value: string): boolean {
    return value === '' || /^\d+(?:\.\d{1,2})?$/.test(value);
}

function calculateActualRevenue(manualRevenue: string): string {
    const manualRevenueValue = manualRevenue === '' ? 0 : Number(manualRevenue);
    const posRevenueValue = Number(POS_ACTUAL_REVENUE);

    if (
        !Number.isFinite(manualRevenueValue) ||
        !Number.isFinite(posRevenueValue)
    ) {
        return POS_ACTUAL_REVENUE;
    }

    return (manualRevenueValue + posRevenueValue)
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1');
}

function manualRevenueStorageKey(kdkmpId: number, businessDate: string): string {
    return `${MANUAL_ACTUAL_REVENUE_STORAGE_PREFIX}:${kdkmpId}:${businessDate}`;
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
    computedValues: KdkmpComputedValues,
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

export default function KdkmpDashboardDailyInputForm({
    businessDate,
    todayEntry,
    computedValues,
    kdkmpId,
}: Props) {
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
    const [manualActualRevenue, setManualActualRevenue] = useState(() =>
        inputValue(todayEntry?.actual_revenue),
    );
    const storageKey = manualRevenueStorageKey(kdkmpId, businessDate);

    useEffect(() => {
        let storedManualRevenue: string | null = null;

        try {
            storedManualRevenue = window.localStorage.getItem(storageKey);
        } catch {
            storedManualRevenue = null;
        }

        const restoredManualRevenue =
            storedManualRevenue !== null && isRevenueValue(storedManualRevenue)
                ? storedManualRevenue
                : inputValue(todayEntry?.actual_revenue);

        setManualActualRevenue(restoredManualRevenue);
        setData(
            'actual_revenue',
            calculateActualRevenue(restoredManualRevenue),
        );
    }, [storageKey, todayEntry?.actual_revenue, setData]);

    const updateManualActualRevenue = (value: string) => {
        const normalizedValue = value.startsWith('-') ? '' : value;

        setManualActualRevenue(normalizedValue);
        setData('actual_revenue', calculateActualRevenue(normalizedValue));

        try {
            window.localStorage.setItem(storageKey, normalizedValue);
        } catch {
            return;
        }
    };

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
        (field) => field.key === 'target_revenue',
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
        const editableField = field.key === 'plan_cost' ? field.key : null;
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
            <Card>
                <CardHeader className="border-b">
                    <CardTitle>Input Data Hari Ini</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <section className="space-y-5 rounded-lg border bg-muted/20 p-4">
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        Revenue
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Rencana dan realisasi pendapatan harian
                                        KDKMP.
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    {revenueFields.map(renderDashboardField)}
                                    <div className="space-y-2">
                                        <Label>Pendapatan POS</Label>
                                        <p className="py-2 text-sm font-semibold text-foreground tabular-nums">
                                            {formatManualValue(
                                                POS_ACTUAL_REVENUE,
                                                true,
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Nilai otomatis dari POS. Integrasi
                                            POS belum tersedia sehingga saat ini
                                            bernilai Rp0.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="actual-revenue-manual">
                                            Pendapatan Manual
                                        </Label>
                                        <RupiahInput
                                            id="actual-revenue-manual"
                                            value={manualActualRevenue}
                                            onValueChange={
                                                updateManualActualRevenue
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Disimpan sementara pada browser ini
                                            untuk KDKMP dan tanggal laporan
                                            tersebut.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Actual Revenue</Label>
                                        <p className="py-2 text-sm font-semibold text-foreground tabular-nums">
                                            {formatManualValue(
                                                calculateActualRevenue(
                                                    manualActualRevenue,
                                                ),
                                                true,
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Akumulasi Pendapatan POS dan
                                            Pendapatan Manual.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-5">
                                    <div>
                                        <h3 className="font-medium text-foreground">
                                            Breakdown Plan Revenue
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Isi seluruh kategori. Nilai 0
                                            diperbolehkan dan ikut dihitung
                                            dalam total Plan Revenue.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {kdkmpPlanRevenueCategories.map(
                                            (category) => (
                                                <div
                                                    key={category.key}
                                                    className="space-y-2"
                                                >
                                                    <Label
                                                        htmlFor={category.key}
                                                    >
                                                        {category.label}
                                                    </Label>
                                                    <RupiahInput
                                                        id={category.key}
                                                        value={
                                                            data[category.key]
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
                                                            errors[category.key]
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
                                                calculatePlanRevenue(data) ||
                                                    null,
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
                                        Target biaya serta pencapaian biaya
                                        harian KDKMP.
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Target Cost</Label>
                                        <p className="py-2 text-sm font-semibold text-foreground tabular-nums">
                                            Rp9.172.133
                                        </p>
                                    </div>
                                    {costFields.map(renderDashboardField)}
                                    <div className="space-y-2">
                                        <Label>
                                            Target EBITDA Margin % (Tahun)
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
                                    Ringkasan penyelesaian task dan penilaian
                                    performa hari ini.
                                </p>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                {performanceFields.map(renderDashboardField)}
                            </div>

                            <div className="space-y-4 border-t pt-5">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="font-medium text-foreground">
                                            Anggota yang masuk (Jumlah Anggota)
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Simpan kehadiran operasional sebelum
                                            memulai task.
                                        </p>
                                    </div>
                                    <div className="rounded-md border bg-background px-3 py-2 text-sm">
                                        <span className="text-muted-foreground">
                                            Jam Operasional:{' '}
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
                                                            role.key
                                                        ]
                                                    }
                                                    onChange={(event) => {
                                                        const value = Math.max(
                                                            0,
                                                            Math.floor(
                                                                Number(
                                                                    event.target
                                                                        .value,
                                                                ) || 0,
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
                                        onClick={saveOperationalAttendance}
                                        disabled={isSavingAttendance}
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
                                Keenam kategori Plan Revenue wajib diisi. Nilai
                                0 tetap dianggap sebagai data valid.
                            </p>
                            <Button type="submit" disabled={processing}>
                                <Save className="size-4" />
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Data Hari Ini'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

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
