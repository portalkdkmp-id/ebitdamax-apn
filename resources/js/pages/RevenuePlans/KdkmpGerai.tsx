import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { EbitdaKdkmpDataOwnerPanel } from '@/components/ebitda-kdkmp-data-owner';
import type { EbitdaKdkmpDataOwner } from '@/components/ebitda-kdkmp-data-owner';
import { Button } from '@/components/ui/button';
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
    index as kdkmpGeraiRevenuePlanIndex,
    store as storeRevenuePlan,
    update as updateRevenuePlan,
} from '@/routes/revenue-plans/kdkmp-gerai';
import type { RevenuePlan, RevenuePlanRow } from '@/types/revenue-plan';

type Props = {
    revenuePlan: RevenuePlan;
    can: {
        create: boolean;
        update: boolean;
    };
    dataOwner: EbitdaKdkmpDataOwner;
    dataOwnerOptions: EbitdaKdkmpDataOwner[];
    canSelectDataOwner: boolean;
};

type RevenuePlanFormData = {
    name: string;
    plan_date: string;
    rka_revenue_target: number | null;
    planned_production_quantity: number | null;
    days_per_month: number | null;
    daily_rka_revenue_target: number | null;
    planned_total_daily_revenue: number | null;
    rows: Array<Omit<RevenuePlanRow, 'id'>>;
};

const topLabelCellClassName =
    'border border-black bg-[#d9d9d9] px-1.5 py-0.5 text-left font-bold';

const topInputCellClassName =
    'border border-black bg-[#fffecb] px-1.5 py-0.5 text-right tabular-nums';

const tableHeaderCellClassName =
    'border border-black bg-[#d9d9d9] px-1.5 py-1 text-center font-bold';

function formatValue(value: number | null): string {
    if (value === null) {
        return '';
    }

    return value.toLocaleString('en-US', {
        maximumFractionDigits: 3,
    });
}

function formatPlaceholderValue(value: number | null): string {
    return value === null ? '-' : formatValue(value);
}

function formatSourceDate(date: string | null): string {
    if (!date) {
        return '';
    }

    const [year, month, day] = date.split('-');

    return `${Number(month)}/${Number(day)}/${year}`;
}

function nullableNumber(value: string): number | null {
    return value === '' ? null : Number(value);
}

function formDataFrom(revenuePlan: RevenuePlan): RevenuePlanFormData {
    return {
        name: revenuePlan.name,
        plan_date: revenuePlan.plan_date ?? '',
        rka_revenue_target: revenuePlan.rka_revenue_target,
        planned_production_quantity: revenuePlan.planned_production_quantity,
        days_per_month: revenuePlan.days_per_month,
        daily_rka_revenue_target: revenuePlan.daily_rka_revenue_target,
        planned_total_daily_revenue: revenuePlan.planned_total_daily_revenue,
        rows: revenuePlan.rows.map((row) => ({
            sort_order: row.sort_order,
            row_type: row.row_type,
            display_number: row.display_number,
            revenue_service: row.revenue_service,
            planned_volume: row.planned_volume,
            unit: row.unit,
            rate: row.rate,
            planned_revenue: row.planned_revenue,
        })),
    };
}

function RevenueRow({ row }: { row: RevenuePlanRow }) {
    return (
        <tr className="h-7">
            <td className="border-x border-b border-dotted border-black px-2 text-right tabular-nums">
                {row.display_number}
            </td>
            <td className="border-x border-b border-dotted border-black px-2 text-left">
                {row.revenue_service}
            </td>
            <td className="border-x border-b border-dotted border-black bg-[#fffecb] px-2 text-center tabular-nums">
                {formatValue(row.planned_volume)}
            </td>
            <td className="border-x border-b border-dotted border-black px-2 text-center">
                {row.unit}
            </td>
            <td className="border-x border-b border-dotted border-black bg-[#fffecb] px-2 text-right tabular-nums">
                {formatValue(row.rate)}
            </td>
            <td className="border-x border-b border-dotted border-black bg-[#8bdde0] px-2 text-right tabular-nums">
                {formatPlaceholderValue(row.planned_revenue)}
            </td>
        </tr>
    );
}

export default function KdkmpGeraiRevenuePlan({
    revenuePlan,
    can,
    dataOwner,
    dataOwnerOptions,
    canSelectDataOwner,
}: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<RevenuePlanFormData>(formDataFrom(revenuePlan));
    const isPersisted = revenuePlan.id !== null;

    const openForm = () => {
        clearErrors();
        setData(formDataFrom(revenuePlan));
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        reset();
        clearErrors();
    };

    const changeDataOwner = (username: string) => {
        closeForm();
        router.visit(
            kdkmpGeraiRevenuePlanIndex({ query: { owner: username } }),
            { preserveScroll: true },
        );
    };

    const updateRow = <Key extends keyof RevenuePlanFormData['rows'][number]>(
        index: number,
        key: Key,
        value: RevenuePlanFormData['rows'][number][Key],
    ) => {
        setData(
            'rows',
            data.rows.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [key]: value } : row,
            ),
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (revenuePlan.id !== null) {
            put(updateRevenuePlan.url(revenuePlan.id), options);

            return;
        }

        post(storeRevenuePlan.url(), options);
    };

    return (
        <>
            <Head title="Rencana Pendapatan" />

            <div className="min-h-screen bg-background p-4 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <EbitdaKdkmpDataOwnerPanel
                        owner={dataOwner}
                        options={dataOwnerOptions}
                        canSelect={canSelectDataOwner}
                        onValueChange={changeDataOwner}
                    />

                    <div className="flex justify-end">
                        {(isPersisted ? can.update : can.create) && (
                            <Button type="button" onClick={openForm}>
                                {isPersisted ? (
                                    <Pencil className="size-4" />
                                ) : (
                                    <Plus className="size-4" />
                                )}
                                {isPersisted ? 'Edit Data' : 'Isi Data'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <div className="w-[1580px] p-7 font-sans text-[14px] leading-tight text-black">
                            <div className="flex items-stretch gap-12">
                                <div className="w-[72px] shrink-0 border border-black bg-[#a6e2ba] text-center font-bold">
                                    <div className="border-b border-black py-2 text-3xl underline">
                                        3
                                    </div>
                                    <div className="flex h-[112px] items-center justify-center text-lg">
                                        3.1
                                    </div>
                                </div>

                                <div className="w-[1400px]">
                                    <h1 className="mb-1 text-[30px] font-bold">
                                        {revenuePlan.name}
                                    </h1>

                                    <table className="w-full table-fixed border-collapse text-[16px]">
                                        <colgroup>
                                            <col className="w-[620px]" />
                                            <col className="w-[200px]" />
                                            <col className="w-[330px]" />
                                            <col className="w-[250px]" />
                                        </colgroup>
                                        <tbody>
                                            <tr>
                                                <th
                                                    className={
                                                        topLabelCellClassName
                                                    }
                                                >
                                                    Tanggal
                                                </th>
                                                <td
                                                    className={`${topInputCellClassName} text-center font-bold`}
                                                >
                                                    {formatSourceDate(
                                                        revenuePlan.plan_date,
                                                    )}
                                                </td>
                                                <th
                                                    className={
                                                        topLabelCellClassName
                                                    }
                                                >
                                                    Target Pendapatan RKA
                                                </th>
                                                <td
                                                    className={
                                                        topInputCellClassName
                                                    }
                                                >
                                                    {formatValue(
                                                        revenuePlan.rka_revenue_target,
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th
                                                    className={
                                                        topLabelCellClassName
                                                    }
                                                >
                                                    Rencana Jumlah Produksi
                                                </th>
                                                <td
                                                    className={
                                                        topInputCellClassName
                                                    }
                                                >
                                                    {formatValue(
                                                        revenuePlan.planned_production_quantity,
                                                    )}
                                                </td>
                                                <th
                                                    className={
                                                        topLabelCellClassName
                                                    }
                                                >
                                                    Jumlah Hari-Bulan
                                                </th>
                                                <td className="border border-black bg-[#8bdde0] px-1.5 py-0.5 text-right tabular-nums">
                                                    {revenuePlan.days_per_month}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th
                                                    className={
                                                        topLabelCellClassName
                                                    }
                                                >
                                                    Target Pendapatan RKA Per
                                                    Hari
                                                </th>
                                                <td
                                                    className={
                                                        topInputCellClassName
                                                    }
                                                >
                                                    {formatPlaceholderValue(
                                                        revenuePlan.daily_rka_revenue_target,
                                                    )}
                                                </td>
                                                <td colSpan={2} />
                                            </tr>
                                            <tr>
                                                <th
                                                    className={
                                                        topLabelCellClassName
                                                    }
                                                >
                                                    Rencana Pendapatan Total
                                                    Perhari
                                                </th>
                                                <td className="border border-black bg-[#8bdde0] px-1.5 py-0.5 text-right font-bold tabular-nums">
                                                    {formatValue(
                                                        revenuePlan.planned_total_daily_revenue,
                                                    )}
                                                </td>
                                                <td colSpan={2} />
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="mt-7 flex items-stretch gap-12">
                                <div className="w-[72px] shrink-0 bg-[#a6e2ba] pt-2 text-center text-lg font-bold">
                                    3.2
                                </div>

                                <table className="w-[1400px] table-fixed border-collapse text-[15px]">
                                    <colgroup>
                                        <col className="w-[80px]" />
                                        <col className="w-[550px]" />
                                        <col className="w-[200px]" />
                                        <col className="w-[180px]" />
                                        <col className="w-[180px]" />
                                        <col className="w-[240px]" />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th
                                                className={
                                                    tableHeaderCellClassName
                                                }
                                            >
                                                No
                                            </th>
                                            <th
                                                className={
                                                    tableHeaderCellClassName
                                                }
                                            >
                                                Pendapatan Layanan Operasional
                                            </th>
                                            <th
                                                className={
                                                    tableHeaderCellClassName
                                                }
                                            >
                                                Jumlah-Volume
                                            </th>
                                            <th
                                                className={
                                                    tableHeaderCellClassName
                                                }
                                            >
                                                Satuan
                                            </th>
                                            <th
                                                className={
                                                    tableHeaderCellClassName
                                                }
                                            >
                                                Tarif (Rp) /
                                            </th>
                                            <th
                                                className={
                                                    tableHeaderCellClassName
                                                }
                                            >
                                                RENCANA
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {revenuePlan.rows.map((row) => (
                                            <RevenueRow
                                                key={row.sort_order}
                                                row={row}
                                            />
                                        ))}

                                        <tr className="h-9 bg-[#b7dce8] font-bold">
                                            <th
                                                scope="row"
                                                colSpan={2}
                                                className="border border-black px-2 text-left text-[17px]"
                                            >
                                                Total Pendapatan
                                            </th>
                                            <td className="border border-black" />
                                            <td className="border border-black" />
                                            <td className="border border-black text-right">
                                                -
                                            </td>
                                            <td className="border border-black px-2 text-right text-[17px] tabular-nums">
                                                {formatValue(
                                                    revenuePlan.planned_total_daily_revenue,
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                open={isFormOpen}
                onOpenChange={(open) =>
                    open ? setIsFormOpen(true) : closeForm()
                }
            >
                <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] min-w-0 overflow-hidden sm:max-w-6xl">
                    <form
                        onSubmit={submit}
                        className="flex max-h-[86vh] min-h-0 w-full min-w-0 flex-col overflow-hidden"
                    >
                        <DialogHeader>
                            <DialogTitle>
                                {isPersisted
                                    ? 'Edit Rencana Pendapatan'
                                    : 'Isi Rencana Pendapatan'}
                            </DialogTitle>
                            <DialogDescription>
                                Lengkapi header serta 12 baris rencana
                                pendapatan sesuai template KDKMP Gerai.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 min-h-0 min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto pr-1">
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="revenue-plan-name">
                                        Nama
                                    </Label>
                                    <Input
                                        id="revenue-plan-name"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="revenue-plan-date">
                                        Tanggal
                                    </Label>
                                    <Input
                                        id="revenue-plan-date"
                                        type="date"
                                        value={data.plan_date}
                                        onChange={(event) =>
                                            setData(
                                                'plan_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="revenue-plan-days">
                                        Jumlah Hari-Bulan
                                    </Label>
                                    <Input
                                        id="revenue-plan-days"
                                        type="number"
                                        min={1}
                                        max={31}
                                        value={data.days_per_month ?? ''}
                                        onChange={(event) =>
                                            setData(
                                                'days_per_month',
                                                nullableNumber(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="revenue-rka-target">
                                        Target Pendapatan RKA
                                    </Label>
                                    <Input
                                        id="revenue-rka-target"
                                        type="number"
                                        min={0}
                                        value={data.rka_revenue_target ?? ''}
                                        onChange={(event) =>
                                            setData(
                                                'rka_revenue_target',
                                                nullableNumber(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="revenue-production">
                                        Rencana Jumlah Produksi
                                    </Label>
                                    <Input
                                        id="revenue-production"
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={
                                            data.planned_production_quantity ??
                                            ''
                                        }
                                        onChange={(event) =>
                                            setData(
                                                'planned_production_quantity',
                                                nullableNumber(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="revenue-daily-target">
                                        Target RKA Per Hari
                                    </Label>
                                    <Input
                                        id="revenue-daily-target"
                                        type="number"
                                        min={0}
                                        value={
                                            data.daily_rka_revenue_target ?? ''
                                        }
                                        onChange={(event) =>
                                            setData(
                                                'daily_rka_revenue_target',
                                                nullableNumber(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="revenue-total-daily">
                                        Total Pendapatan Perhari
                                    </Label>
                                    <Input
                                        id="revenue-total-daily"
                                        type="number"
                                        min={0}
                                        value={
                                            data.planned_total_daily_revenue ??
                                            ''
                                        }
                                        onChange={(event) =>
                                            setData(
                                                'planned_total_daily_revenue',
                                                nullableNumber(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {Object.keys(errors).length > 0 && (
                                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                    Periksa kembali header dan nilai pada baris
                                    Rencana Pendapatan.
                                </p>
                            )}

                            <div className="max-h-[58vh] w-full max-w-full overflow-auto rounded-md border">
                                <table className="w-full min-w-[980px] table-fixed border-collapse text-sm">
                                    <thead className="sticky top-0 z-10 bg-muted">
                                        <tr>
                                            <th className="w-16 border p-2">
                                                No
                                            </th>
                                            <th className="w-[360px] border p-2">
                                                Pendapatan Layanan Operasional
                                            </th>
                                            <th className="w-36 border p-2">
                                                Jumlah-Volume
                                            </th>
                                            <th className="w-36 border p-2">
                                                Satuan
                                            </th>
                                            <th className="w-44 border p-2">
                                                Tarif
                                            </th>
                                            <th className="w-44 border p-2">
                                                Rencana
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.rows.map((row, index) => (
                                            <tr key={row.sort_order}>
                                                <td className="border p-2 text-center">
                                                    {row.display_number}
                                                </td>
                                                <td className="border p-2">
                                                    <Input
                                                        value={
                                                            row.revenue_service ??
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            updateRow(
                                                                index,
                                                                'revenue_service',
                                                                event.target
                                                                    .value ||
                                                                    null,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step="any"
                                                        value={
                                                            row.planned_volume ??
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            updateRow(
                                                                index,
                                                                'planned_volume',
                                                                nullableNumber(
                                                                    event.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <Input
                                                        value={row.unit ?? ''}
                                                        onChange={(event) =>
                                                            updateRow(
                                                                index,
                                                                'unit',
                                                                event.target
                                                                    .value ||
                                                                    null,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={row.rate ?? ''}
                                                        onChange={(event) =>
                                                            updateRow(
                                                                index,
                                                                'rate',
                                                                nullableNumber(
                                                                    event.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={
                                                            row.planned_revenue ??
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            updateRow(
                                                                index,
                                                                'planned_revenue',
                                                                nullableNumber(
                                                                    event.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <DialogFooter className="mt-4 border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeForm}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

KdkmpGeraiRevenuePlan.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Rencana Pendapatan',
            href: kdkmpGeraiRevenuePlanIndex(),
        },
    ],
};
