import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
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
    index as kdkmpGeraiPlanEbitdaMatrixIndex,
    store as storePlanEbitdaMatrix,
    update as updatePlanEbitdaMatrix,
} from '@/routes/plan-ebitda-matrices/kdkmp-gerai';
import type {
    PlanEbitdaMatrix,
    PlanEbitdaMatrixDependencies,
    PlanEbitdaMatrixProcess,
    PlanEbitdaMatrixRow,
} from '@/types/plan-ebitda-matrix';

type Props = {
    matrix: PlanEbitdaMatrix;
    can: {
        create: boolean;
        update: boolean;
    };
    dependencies: PlanEbitdaMatrixDependencies;
    dataOwner: EbitdaKdkmpDataOwner;
    dataOwnerOptions: EbitdaKdkmpDataOwner[];
    canSelectDataOwner: boolean;
};

type MatrixFormData = {
    name: string;
    processes: Array<Omit<PlanEbitdaMatrixProcess, 'id'>>;
    rows: Array<Omit<PlanEbitdaMatrixRow, 'id'>>;
};

const headerCellClassName =
    'border border-black bg-[#d9d9d9] px-1.5 py-1 text-center align-middle font-bold';

function formDataFrom(matrix: PlanEbitdaMatrix): MatrixFormData {
    return {
        name: matrix.name,
        processes: matrix.processes.map((process) => ({
            sequence: process.sequence,
            process_group: process.process_group,
            detail_process: process.detail_process,
            unit_name: process.unit_name,
            pic: process.pic,
        })),
        rows: matrix.rows.map((row) => ({
            section_code: row.section_code,
            sort_order: row.sort_order,
            row_type: row.row_type,
            label: row.label,
            values: [...row.values],
            total: row.total,
            notes: row.notes,
            notes_tone: row.notes_tone,
            is_calculated: row.is_calculated,
            source_page: row.source_page,
        })),
    };
}

function formatMatrixValue(value: string | null): string {
    if (value === null || value === '') {
        return '-';
    }

    const normalized = Number(value);

    if (!Number.isFinite(normalized)) {
        return value;
    }

    return normalized.toLocaleString('en-US', {
        maximumFractionDigits: 9,
    });
}

function sectionSpans(rows: PlanEbitdaMatrixRow[]): Map<string, number> {
    return rows.reduce((spans, row) => {
        spans.set(row.section_code, (spans.get(row.section_code) ?? 0) + 1);

        return spans;
    }, new Map<string, number>());
}

function missingDependencies(
    dependencies: PlanEbitdaMatrixDependencies,
): string[] {
    return [
        !dependencies.businessProcess ? 'Business Process' : null,
        !dependencies.unitCostAssumption ? 'Unit Cost Assumption' : null,
        !dependencies.revenuePlan ? 'Rencana Pendapatan' : null,
    ].filter((dependency): dependency is string => dependency !== null);
}

function ProcessHeader({
    processes,
}: {
    processes: PlanEbitdaMatrixProcess[];
}) {
    return (
        <thead>
            <tr>
                <th
                    rowSpan={4}
                    className="sticky left-0 z-30 w-20 min-w-20 border border-black bg-[#a6e2ba] text-center align-middle text-base font-bold"
                >
                    <span className="block text-2xl underline">4</span>
                    <span className="mt-3 block">4.1</span>
                </th>
                <th
                    rowSpan={4}
                    className="sticky left-20 z-30 w-[360px] min-w-[360px] border border-black bg-white px-3 text-left align-middle text-2xl font-bold"
                >
                    URUTAN PROSES
                </th>
                {processes.map((process) => (
                    <th
                        key={`group-${process.sequence}`}
                        className={`${headerCellClassName} h-32 w-36 min-w-36 align-top`}
                    >
                        <span className="mb-1 block text-xs font-normal">
                            {process.sequence}
                        </span>
                        {process.process_group}
                    </th>
                ))}
                <th rowSpan={4} className={`${headerCellClassName} w-40`}>
                    TOTAL / NILAI
                </th>
                <th rowSpan={4} className={`${headerCellClassName} w-64`}>
                    KETERANGAN
                </th>
            </tr>
            <tr>
                {processes.map((process) => (
                    <th
                        key={`detail-${process.sequence}`}
                        className={`${headerCellClassName} h-52 align-top text-[10px] font-normal`}
                    >
                        {process.detail_process}
                    </th>
                ))}
            </tr>
            <tr>
                {processes.map((process) => (
                    <th
                        key={`unit-${process.sequence}`}
                        className={`${headerCellClassName} h-10 text-[10px] font-normal`}
                    >
                        {process.unit_name}
                    </th>
                ))}
            </tr>
            <tr>
                {processes.map((process) => (
                    <th
                        key={`pic-${process.sequence}`}
                        className={`${headerCellClassName} h-16 text-[10px]`}
                    >
                        {process.pic}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

function MatrixBody({ rows }: { rows: PlanEbitdaMatrixRow[] }) {
    const spans = sectionSpans(rows);
    const renderedSections = new Set<string>();

    return (
        <tbody>
            {rows.map((row) => {
                const isFirstSectionRow = !renderedSections.has(
                    row.section_code,
                );
                renderedSections.add(row.section_code);
                const valueBackground = row.is_calculated
                    ? 'bg-[#8bdde0]'
                    : 'bg-[#fffecb]';
                const labelBackground =
                    row.row_type === 'summary'
                        ? 'bg-[#b7dce8] font-bold'
                        : 'bg-white';
                const notesBackground =
                    row.notes_tone === 'blue'
                        ? 'bg-[#8bdde0]'
                        : row.notes_tone === 'yellow'
                          ? 'bg-[#fffecb]'
                          : 'bg-white';

                return (
                    <tr key={row.sort_order} className="min-h-7">
                        {isFirstSectionRow && (
                            <th
                                rowSpan={spans.get(row.section_code)}
                                className="sticky left-0 z-20 border border-black bg-[#a6e2ba] px-1 text-center align-top text-base font-bold"
                            >
                                <span className="sticky top-3 block py-2">
                                    {row.section_code}
                                </span>
                            </th>
                        )}
                        <th
                            scope="row"
                            className={`sticky left-20 z-10 border border-black px-2 py-1.5 text-left text-[11px] ${labelBackground}`}
                        >
                            {row.label}
                        </th>
                        {row.values.map((value, valueIndex) => (
                            <td
                                key={`${row.sort_order}-${valueIndex}`}
                                className={`border border-black px-1 py-1 text-right text-[11px] tabular-nums ${valueBackground}`}
                            >
                                {formatMatrixValue(value)}
                            </td>
                        ))}
                        <td className="border border-black bg-[#b7dce8] px-2 py-1 text-right text-[11px] font-bold tabular-nums">
                            {formatMatrixValue(row.total)}
                        </td>
                        <td
                            className={`border border-black px-2 py-1 text-left text-[10px] ${notesBackground}`}
                        >
                            {row.notes}
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
}

export default function KdkmpGeraiPlanEbitdaMatrix({
    matrix,
    can,
    dependencies,
    dataOwner,
    dataOwnerOptions,
    canSelectDataOwner,
}: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<MatrixFormData>(formDataFrom(matrix));
    const isPersisted = matrix.id !== null;
    const missing = useMemo(
        () => missingDependencies(dependencies),
        [dependencies],
    );

    const openForm = () => {
        clearErrors();
        setData(formDataFrom(matrix));
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
            kdkmpGeraiPlanEbitdaMatrixIndex({
                query: { owner: username },
            }),
            { preserveScroll: true },
        );
    };

    const updateProcess = <
        Key extends keyof MatrixFormData['processes'][number],
    >(
        index: number,
        key: Key,
        value: MatrixFormData['processes'][number][Key],
    ) => {
        setData(
            'processes',
            data.processes.map((process, processIndex) =>
                processIndex === index ? { ...process, [key]: value } : process,
            ),
        );
    };

    const updateRow = <Key extends keyof MatrixFormData['rows'][number]>(
        index: number,
        key: Key,
        value: MatrixFormData['rows'][number][Key],
    ) => {
        setData(
            'rows',
            data.rows.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [key]: value } : row,
            ),
        );
    };

    const updateCell = (
        rowIndex: number,
        valueIndex: number,
        value: string,
    ) => {
        setData(
            'rows',
            data.rows.map((row, currentRowIndex) => {
                if (currentRowIndex !== rowIndex) {
                    return row;
                }

                const values = [...row.values];
                values[valueIndex] = value === '' ? null : value;

                return { ...row, values };
            }),
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (matrix.id !== null) {
            put(updatePlanEbitdaMatrix.url(matrix.id), options);

            return;
        }

        post(storePlanEbitdaMatrix.url(), options);
    };

    return (
        <>
            <Head title="Plan EBITDA Matrix" />

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

                {!dependencies.complete && (
                    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                        Lengkapi data {missing.join(', ')} terlebih dahulu
                        sebelum membuat Plan EBITDA Matrix. Template tetap
                        ditampilkan sebagai pratinjau.
                    </div>
                )}

                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <div className="min-w-[3260px] p-5 font-sans text-black">
                            <h1 className="mb-3 pl-[440px] text-3xl font-bold">
                                {matrix.name}
                            </h1>

                            <table className="w-full table-fixed border-collapse">
                                <colgroup>
                                    <col className="w-20" />
                                    <col className="w-[360px]" />
                                    {matrix.processes.map((process) => (
                                        <col
                                            key={process.sequence}
                                            className="w-36"
                                        />
                                    ))}
                                    <col className="w-40" />
                                    <col className="w-64" />
                                </colgroup>
                                <ProcessHeader processes={matrix.processes} />
                                <MatrixBody rows={matrix.rows} />
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
                <DialogContent className="max-h-[94vh] w-[calc(100vw-2rem)] min-w-0 overflow-hidden sm:max-w-[calc(100vw-3rem)]">
                    <form
                        onSubmit={submit}
                        className="flex max-h-[90vh] min-h-0 w-full min-w-0 flex-col overflow-hidden"
                    >
                        <DialogHeader>
                            <DialogTitle>
                                {isPersisted
                                    ? 'Edit Plan EBITDA Matrix'
                                    : 'Isi Plan EBITDA Matrix'}
                            </DialogTitle>
                            <DialogDescription>
                                Edit snapshot 17 proses dan nilai matriks. Area
                                tabel dapat digeser ke kanan dan ke bawah.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto pr-1">
                            <div className="max-w-xl space-y-2">
                                <Label htmlFor="plan-ebitda-matrix-name">
                                    Nama
                                </Label>
                                <Input
                                    id="plan-ebitda-matrix-name"
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                />
                            </div>

                            {Object.keys(errors).length > 0 && (
                                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                    Periksa kembali data proses dan seluruh
                                    nilai Plan EBITDA Matrix.
                                </p>
                            )}

                            <section className="min-w-0 space-y-2">
                                <h3 className="font-semibold">
                                    4.1 Urutan Proses
                                </h3>
                                <div className="max-h-[48vh] w-full overflow-auto rounded-md border">
                                    <table className="min-w-[1680px] table-fixed border-collapse text-sm">
                                        <thead className="sticky top-0 z-10 bg-muted">
                                            <tr>
                                                <th className="w-16 border p-2">
                                                    No
                                                </th>
                                                <th className="w-72 border p-2">
                                                    Tahapan Proses
                                                </th>
                                                <th className="w-[620px] border p-2">
                                                    Rincian Proses
                                                </th>
                                                <th className="w-56 border p-2">
                                                    Unit Kerja
                                                </th>
                                                <th className="w-64 border p-2">
                                                    PIC
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.processes.map(
                                                (process, index) => (
                                                    <tr key={process.sequence}>
                                                        <td className="border p-2 text-center">
                                                            {process.sequence}
                                                        </td>
                                                        <td className="border p-2 align-top">
                                                            <textarea
                                                                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                                rows={3}
                                                                value={
                                                                    process.process_group
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateProcess(
                                                                        index,
                                                                        'process_group',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td className="border p-2 align-top">
                                                            <textarea
                                                                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                                rows={4}
                                                                value={
                                                                    process.detail_process
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateProcess(
                                                                        index,
                                                                        'detail_process',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td className="border p-2 align-top">
                                                            <Input
                                                                value={
                                                                    process.unit_name ??
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateProcess(
                                                                        index,
                                                                        'unit_name',
                                                                        event
                                                                            .target
                                                                            .value ||
                                                                            null,
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td className="border p-2 align-top">
                                                            <Input
                                                                value={
                                                                    process.pic
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateProcess(
                                                                        index,
                                                                        'pic',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="min-w-0 space-y-2">
                                <h3 className="font-semibold">
                                    4.2–4.19 Nilai Plan EBITDA Matrix
                                </h3>
                                <div className="max-h-[58vh] w-full overflow-auto rounded-md border">
                                    <table className="min-w-[3260px] table-fixed border-collapse text-xs">
                                        <thead className="sticky top-0 z-20 bg-muted">
                                            <tr>
                                                <th className="w-20 border p-2">
                                                    Bagian
                                                </th>
                                                <th className="w-[360px] border p-2">
                                                    Baris
                                                </th>
                                                {data.processes.map(
                                                    (process) => (
                                                        <th
                                                            key={
                                                                process.sequence
                                                            }
                                                            className="w-36 border p-2"
                                                        >
                                                            Proses{' '}
                                                            {process.sequence}
                                                        </th>
                                                    ),
                                                )}
                                                <th className="w-40 border p-2">
                                                    Total
                                                </th>
                                                <th className="w-64 border p-2">
                                                    Keterangan
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.rows.map((row, rowIndex) => (
                                                <tr key={row.sort_order}>
                                                    <td className="border p-2 text-center font-semibold">
                                                        {row.section_code}
                                                    </td>
                                                    <td className="border p-2">
                                                        <textarea
                                                            className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                            rows={2}
                                                            value={row.label}
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    rowIndex,
                                                                    'label',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    {row.values.map(
                                                        (value, valueIndex) => (
                                                            <td
                                                                key={`${row.sort_order}-${valueIndex}`}
                                                                className="border p-1.5"
                                                            >
                                                                <Input
                                                                    value={
                                                                        value ??
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateCell(
                                                                            rowIndex,
                                                                            valueIndex,
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="min-w-24 text-right tabular-nums"
                                                                />
                                                            </td>
                                                        ),
                                                    )}
                                                    <td className="border p-1.5">
                                                        <Input
                                                            value={
                                                                row.total ?? ''
                                                            }
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    rowIndex,
                                                                    'total',
                                                                    event.target
                                                                        .value ||
                                                                        null,
                                                                )
                                                            }
                                                            className="text-right font-semibold tabular-nums"
                                                        />
                                                    </td>
                                                    <td className="border p-1.5">
                                                        <textarea
                                                            className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                            rows={2}
                                                            value={
                                                                row.notes ?? ''
                                                            }
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    rowIndex,
                                                                    'notes',
                                                                    event.target
                                                                        .value ||
                                                                        null,
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>

                        <DialogFooter className="mt-4 shrink-0">
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
