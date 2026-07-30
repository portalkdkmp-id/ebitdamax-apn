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
    index as kdkmpGeraiUnitCostAssumptionIndex,
    store as storeUnitCostAssumption,
    update as updateUnitCostAssumption,
} from '@/routes/unit-cost-assumptions/kdkmp-gerai';
import type {
    UnitCostAssumption,
    UnitCostAssumptionRow,
} from '@/types/unit-cost-assumption';

type Props = {
    assumption: UnitCostAssumption;
    can: {
        create: boolean;
        update: boolean;
    };
    dataOwner: EbitdaKdkmpDataOwner;
    dataOwnerOptions: EbitdaKdkmpDataOwner[];
    canSelectDataOwner: boolean;
};

type UnitCostAssumptionFormData = {
    name: string;
    assumption_date: string;
    days_per_year: number | null;
    days_per_month: number | null;
    work_hours_per_day: number | null;
    rows: Array<Omit<UnitCostAssumptionRow, 'id'>>;
};

const headerCellClassName =
    'border border-black bg-[#d9d9d9] px-1.5 py-1 text-left align-top font-bold';

const textCellClassName =
    'border-x border-b border-dotted border-black px-1.5 py-0.5 text-left align-top';

const inputCellClassName =
    'border-x border-b border-dotted border-black bg-[#fffecb] px-1.5 py-0.5 align-top';

const costCellClassName =
    'border-x border-b border-dotted border-black bg-[#b7e3e5] px-1.5 py-0.5 text-right align-top tabular-nums';

function formatValue(value: number | null): string {
    if (value === null) {
        return '';
    }

    return value.toLocaleString('en-US', {
        maximumFractionDigits: 3,
    });
}

function formatCost(value: number | null): string {
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

function formDataFrom(
    assumption: UnitCostAssumption,
): UnitCostAssumptionFormData {
    return {
        name: assumption.name,
        assumption_date: assumption.assumption_date ?? '',
        days_per_year: assumption.days_per_year,
        days_per_month: assumption.days_per_month,
        work_hours_per_day: assumption.work_hours_per_day,
        rows: assumption.rows.map((row) => ({
            sort_order: row.sort_order,
            source_page: row.source_page,
            row_type: row.row_type,
            section_code: row.section_code,
            category: row.category,
            cost_type: row.cost_type,
            component: row.component,
            plan_quantity: row.plan_quantity,
            actual_quantity: row.actual_quantity,
            description: row.description,
            unit: row.unit,
            base_price: row.base_price,
            plan_daily_cost: row.plan_daily_cost,
            plan_hourly_cost: row.plan_hourly_cost,
            actual_daily_cost: row.actual_daily_cost,
            actual_hourly_cost: row.actual_hourly_cost,
            plan_value: row.plan_value,
            actual_value: row.actual_value,
        })),
    };
}

function sectionSpans(rows: UnitCostAssumptionRow[]): Map<string, number> {
    return rows.reduce((spans, row) => {
        if (row.section_code) {
            spans.set(row.section_code, (spans.get(row.section_code) ?? 0) + 1);
        }

        return spans;
    }, new Map<string, number>());
}

function StandardRow({
    row,
    sectionRowSpan,
}: {
    row: UnitCostAssumptionRow;
    sectionRowSpan?: number;
}) {
    const isSubtotal = row.row_type === 'subtotal';
    const isGroup = row.row_type === 'group';
    const isBlank = row.row_type === 'blank';
    const summaryClassName = isSubtotal
        ? 'border border-black bg-[#8bdde0] font-bold'
        : textCellClassName;
    const inputClassName = isSubtotal
        ? 'border border-black bg-[#8bdde0] font-bold'
        : inputCellClassName;
    const costClassName = isSubtotal
        ? 'border border-black bg-[#8bdde0] text-right font-bold tabular-nums'
        : costCellClassName;

    return (
        <tr className={isBlank ? 'h-6' : ''}>
            {sectionRowSpan && row.section_code ? (
                <th
                    scope="rowgroup"
                    rowSpan={sectionRowSpan}
                    className="border border-black bg-[#a6e2ba] px-2 pt-3 text-center align-top text-sm font-bold underline"
                >
                    {row.section_code}
                </th>
            ) : null}
            <td className={`${summaryClassName} w-[190px]`}>{row.category}</td>
            <td className={`${summaryClassName} w-[150px]`}>{row.cost_type}</td>
            <td
                className={`${summaryClassName} w-[480px] ${isGroup ? 'font-bold' : ''}`}
            >
                {row.component}
            </td>
            <td
                className={`${inputClassName} w-[95px] text-center tabular-nums`}
            >
                {formatValue(row.plan_quantity)}
            </td>
            <td
                className={`${inputClassName} w-[95px] text-center tabular-nums`}
            >
                {formatValue(row.actual_quantity)}
            </td>
            <td className={`${inputClassName} w-[310px]`}>{row.description}</td>
            <td className={`${inputClassName} w-[230px]`}>{row.unit}</td>
            <td
                className={`${inputClassName} w-[190px] text-right tabular-nums`}
            >
                {formatValue(row.base_price)}
            </td>
            <td className={`${costClassName} w-[145px]`}>
                {formatCost(row.plan_daily_cost)}
            </td>
            <td className={`${costClassName} w-[145px]`}>
                {formatCost(row.plan_hourly_cost)}
            </td>
            <td className={`${costClassName} w-[145px]`}>
                {formatCost(row.actual_daily_cost)}
            </td>
            <td className={`${costClassName} w-[145px]`}>
                {formatCost(row.actual_hourly_cost)}
            </td>
            <td
                className={`${textCellClassName} w-[115px] text-right tabular-nums`}
            >
                {formatValue(row.plan_value)}
            </td>
            <td
                className={`${textCellClassName} w-[115px] text-right tabular-nums`}
            >
                {formatValue(row.actual_value)}
            </td>
        </tr>
    );
}

function TotalRow({ row }: { row: UnitCostAssumptionRow }) {
    return (
        <tr className="font-bold">
            <td className="border border-transparent bg-white" />
            <th
                scope="row"
                colSpan={8}
                className="border border-black bg-white px-1.5 py-1 text-left"
            >
                {row.component}
            </th>
            <td className="border border-black bg-[#8bdde0] px-1.5 py-1 text-right tabular-nums">
                {formatCost(row.plan_daily_cost)}
            </td>
            <td className="border border-black bg-[#8bdde0] px-1.5 py-1 text-right tabular-nums">
                {formatCost(row.plan_hourly_cost)}
            </td>
            <td className="border border-black bg-[#8bdde0] px-1.5 py-1 text-right tabular-nums">
                {formatCost(row.actual_daily_cost)}
            </td>
            <td className="border border-black bg-[#8bdde0] px-1.5 py-1 text-right tabular-nums">
                {formatCost(row.actual_hourly_cost)}
            </td>
            <td className="border border-transparent bg-white" />
            <td className="border border-transparent bg-white" />
        </tr>
    );
}

export default function KdkmpGeraiUnitCostAssumption({
    assumption,
    can,
    dataOwner,
    dataOwnerOptions,
    canSelectDataOwner,
}: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<UnitCostAssumptionFormData>(formDataFrom(assumption));
    const isPersisted = assumption.id !== null;
    const spans = sectionSpans(assumption.rows);
    const renderedSections = new Set<string>();

    const openForm = () => {
        clearErrors();
        setData(formDataFrom(assumption));
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
            kdkmpGeraiUnitCostAssumptionIndex({ query: { owner: username } }),
            { preserveScroll: true },
        );
    };

    const updateRow = <
        Key extends keyof UnitCostAssumptionFormData['rows'][number],
    >(
        index: number,
        key: Key,
        value: UnitCostAssumptionFormData['rows'][number][Key],
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

        if (assumption.id !== null) {
            put(updateUnitCostAssumption.url(assumption.id), options);

            return;
        }

        post(storeUnitCostAssumption.url(), options);
    };

    return (
        <>
            <Head title="Unit Cost Assumption" />

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
                        <div className="w-[2860px] p-5 font-sans text-[11px] leading-tight text-black">
                            <div className="mb-7 flex items-start gap-6">
                                <div className="w-[72px] shrink-0 border border-black bg-[#a6e2ba] text-center font-bold">
                                    <div className="border-b border-black py-1 text-2xl underline">
                                        2
                                    </div>
                                    <div className="py-8 text-base underline">
                                        2.1
                                    </div>
                                </div>

                                <h1 className="w-[360px] pt-1 text-2xl font-bold">
                                    {assumption.name}
                                </h1>

                                <table className="w-[620px] table-fixed border-collapse text-sm">
                                    <tbody>
                                        <tr>
                                            <th className="border border-black bg-[#f4f4f4] px-1.5 text-left">
                                                Tanggal
                                            </th>
                                            <td className="border border-black bg-[#fffecb] px-1.5 text-center font-bold">
                                                {formatSourceDate(
                                                    assumption.assumption_date,
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="border border-black bg-[#f4f4f4] px-1.5 text-left">
                                                Jumlah Hari Setahun
                                            </th>
                                            <td className="border border-black bg-[#fffecb] px-1.5 text-center">
                                                {assumption.days_per_year}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="border border-black bg-[#f4f4f4] px-1.5 text-left">
                                                Jumlah Hari Sebulan
                                            </th>
                                            <td className="border border-black bg-[#b7e3e5] px-1.5 text-center">
                                                {assumption.days_per_month}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="border border-black bg-[#f4f4f4] px-1.5 text-left">
                                                Rata-Rata Jam Kerja Perhari
                                            </th>
                                            <td className="border border-black bg-[#fffecb] px-1.5 text-center">
                                                {formatValue(
                                                    assumption.work_hours_per_day,
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <table className="w-full table-fixed border-collapse">
                                <colgroup>
                                    <col className="w-[72px]" />
                                    <col className="w-[190px]" />
                                    <col className="w-[150px]" />
                                    <col className="w-[480px]" />
                                    <col className="w-[95px]" />
                                    <col className="w-[95px]" />
                                    <col className="w-[310px]" />
                                    <col className="w-[230px]" />
                                    <col className="w-[190px]" />
                                    <col className="w-[145px]" />
                                    <col className="w-[145px]" />
                                    <col className="w-[145px]" />
                                    <col className="w-[145px]" />
                                    <col className="w-[115px]" />
                                    <col className="w-[115px]" />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th className="border border-transparent bg-white" />
                                        <th className={headerCellClassName}>
                                            Kategori
                                        </th>
                                        <th className={headerCellClassName}>
                                            Jenis
                                        </th>
                                        <th className={headerCellClassName}>
                                            Komponen Baiya
                                        </th>
                                        <th
                                            className={`${headerCellClassName} text-center`}
                                        >
                                            Jumlah/Volume PLAN
                                        </th>
                                        <th
                                            className={`${headerCellClassName} text-center`}
                                        >
                                            Jumlah/Volume AKTUAL
                                        </th>
                                        <th className={headerCellClassName}>
                                            Keterangan
                                        </th>
                                        <th className={headerCellClassName}>
                                            Satuan Unit
                                        </th>
                                        <th className={headerCellClassName}>
                                            Harga Dasar/Harga Beli (Rp)
                                        </th>
                                        <th className={headerCellClassName}>
                                            Biaya Perhari (Rp) PLAN
                                        </th>
                                        <th className={headerCellClassName}>
                                            Biaya Perjam (Rp) PLAN
                                        </th>
                                        <th className={headerCellClassName}>
                                            Biaya Perhari (Rp) AKTUAL
                                        </th>
                                        <th className={headerCellClassName}>
                                            Biaya Perjam (Rp) AKTUAL
                                        </th>
                                        <th
                                            className={`${headerCellClassName} text-center`}
                                        >
                                            PLAN
                                        </th>
                                        <th
                                            className={`${headerCellClassName} text-center`}
                                        >
                                            AKTUAL
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assumption.rows.map((row) => {
                                        if (row.row_type === 'total') {
                                            return (
                                                <TotalRow
                                                    key={row.sort_order}
                                                    row={row}
                                                />
                                            );
                                        }

                                        const shouldRenderSection =
                                            row.section_code !== null &&
                                            !renderedSections.has(
                                                row.section_code,
                                            );

                                        if (
                                            shouldRenderSection &&
                                            row.section_code
                                        ) {
                                            renderedSections.add(
                                                row.section_code,
                                            );
                                        }

                                        return (
                                            <StandardRow
                                                key={row.sort_order}
                                                row={row}
                                                sectionRowSpan={
                                                    shouldRenderSection &&
                                                    row.section_code
                                                        ? spans.get(
                                                              row.section_code,
                                                          )
                                                        : undefined
                                                }
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
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
                <DialogContent className="max-h-[94vh] w-[calc(100vw-1.5rem)] min-w-0 overflow-hidden sm:max-w-[98vw]">
                    <form
                        onSubmit={submit}
                        className="flex max-h-[89vh] min-h-0 w-full min-w-0 flex-col overflow-hidden"
                    >
                        <DialogHeader>
                            <DialogTitle>
                                {isPersisted
                                    ? 'Edit Unit Cost Assumption'
                                    : 'Isi Unit Cost Assumption'}
                            </DialogTitle>
                            <DialogDescription>
                                Lengkapi header dan 74 baris template. Struktur
                                section dan urutan baris tetap dipertahankan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 min-h-0 min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto pr-1">
                            <div className="grid gap-4 md:grid-cols-5">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="unit-cost-name">Nama</Label>
                                    <Input
                                        id="unit-cost-name"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit-cost-date">
                                        Tanggal
                                    </Label>
                                    <Input
                                        id="unit-cost-date"
                                        type="date"
                                        value={data.assumption_date}
                                        onChange={(event) =>
                                            setData(
                                                'assumption_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit-cost-days-year">
                                        Hari Setahun
                                    </Label>
                                    <Input
                                        id="unit-cost-days-year"
                                        type="number"
                                        min={1}
                                        max={366}
                                        value={data.days_per_year ?? ''}
                                        onChange={(event) =>
                                            setData(
                                                'days_per_year',
                                                nullableNumber(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit-cost-days-month">
                                        Hari Sebulan
                                    </Label>
                                    <Input
                                        id="unit-cost-days-month"
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
                                    <Label htmlFor="unit-cost-hours-day">
                                        Jam Kerja Perhari
                                    </Label>
                                    <Input
                                        id="unit-cost-hours-day"
                                        type="number"
                                        min={0.01}
                                        max={24}
                                        step="0.01"
                                        value={data.work_hours_per_day ?? ''}
                                        onChange={(event) =>
                                            setData(
                                                'work_hours_per_day',
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
                                    Unit Cost Assumption.
                                </p>
                            )}

                            <div className="max-h-[62vh] w-full max-w-full overflow-auto rounded-md border">
                                <table className="w-[2600px] table-fixed border-collapse text-xs">
                                    <thead className="sticky top-0 z-10 bg-muted">
                                        <tr>
                                            <th className="w-14 border p-2">
                                                No
                                            </th>
                                            <th className="w-24 border p-2">
                                                Section
                                            </th>
                                            <th className="w-52 border p-2">
                                                Kategori
                                            </th>
                                            <th className="w-44 border p-2">
                                                Jenis
                                            </th>
                                            <th className="w-[360px] border p-2">
                                                Komponen Biaya
                                            </th>
                                            <th className="w-32 border p-2">
                                                Volume Plan
                                            </th>
                                            <th className="w-32 border p-2">
                                                Volume Aktual
                                            </th>
                                            <th className="w-64 border p-2">
                                                Keterangan
                                            </th>
                                            <th className="w-48 border p-2">
                                                Satuan
                                            </th>
                                            <th className="w-44 border p-2">
                                                Harga Dasar
                                            </th>
                                            <th className="w-40 border p-2">
                                                Plan/Hari
                                            </th>
                                            <th className="w-40 border p-2">
                                                Plan/Jam
                                            </th>
                                            <th className="w-40 border p-2">
                                                Aktual/Hari
                                            </th>
                                            <th className="w-40 border p-2">
                                                Aktual/Jam
                                            </th>
                                            <th className="w-36 border p-2">
                                                Plan
                                            </th>
                                            <th className="w-36 border p-2">
                                                Aktual
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.rows.map((row, index) => (
                                            <tr key={row.sort_order}>
                                                <td className="border p-2 text-center align-top">
                                                    {row.sort_order}
                                                </td>
                                                <td className="border p-2 text-center align-top">
                                                    {row.section_code}
                                                </td>
                                                <td className="border p-2 align-top">
                                                    <Input
                                                        value={
                                                            row.category ?? ''
                                                        }
                                                        onChange={(event) =>
                                                            updateRow(
                                                                index,
                                                                'category',
                                                                event.target
                                                                    .value ||
                                                                    null,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="border p-2 align-top">
                                                    <Input
                                                        value={
                                                            row.cost_type ?? ''
                                                        }
                                                        onChange={(event) =>
                                                            updateRow(
                                                                index,
                                                                'cost_type',
                                                                event.target
                                                                    .value ||
                                                                    null,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="border p-2 align-top">
                                                    <textarea
                                                        className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        value={
                                                            row.component ?? ''
                                                        }
                                                        onChange={(event) =>
                                                            updateRow(
                                                                index,
                                                                'component',
                                                                event.target
                                                                    .value ||
                                                                    null,
                                                            )
                                                        }
                                                        rows={2}
                                                    />
                                                </td>
                                                {(
                                                    [
                                                        'plan_quantity',
                                                        'actual_quantity',
                                                    ] as const
                                                ).map((field) => (
                                                    <td
                                                        key={field}
                                                        className="border p-2 align-top"
                                                    >
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            value={
                                                                row[field] ?? ''
                                                            }
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    field,
                                                                    nullableNumber(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                ))}
                                                <td className="border p-2 align-top">
                                                    <textarea
                                                        className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        value={
                                                            row.description ??
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            updateRow(
                                                                index,
                                                                'description',
                                                                event.target
                                                                    .value ||
                                                                    null,
                                                            )
                                                        }
                                                        rows={2}
                                                    />
                                                </td>
                                                <td className="border p-2 align-top">
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
                                                {(
                                                    [
                                                        'base_price',
                                                        'plan_daily_cost',
                                                        'plan_hourly_cost',
                                                        'actual_daily_cost',
                                                        'actual_hourly_cost',
                                                        'plan_value',
                                                        'actual_value',
                                                    ] as const
                                                ).map((field) => (
                                                    <td
                                                        key={field}
                                                        className="border p-2 align-top"
                                                    >
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            value={
                                                                row[field] ?? ''
                                                            }
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    field,
                                                                    nullableNumber(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                ))}
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

KdkmpGeraiUnitCostAssumption.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Unit Cost Assumption',
            href: kdkmpGeraiUnitCostAssumptionIndex(),
        },
    ],
};
