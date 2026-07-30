import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
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
    index as kdkmpGeraiBusinessProcessIndex,
    store as storeBusinessProcess,
    update as updateBusinessProcess,
} from '@/routes/business-processes/kdkmp-gerai';
import type {
    BusinessProcess,
    BusinessProcessStep,
} from '@/types/business-process';

type Props = {
    businessProcess: BusinessProcess;
    totalStandardTimeMinutes: number;
    can: {
        create: boolean;
        update: boolean;
    };
    dataOwner: EbitdaKdkmpDataOwner;
    dataOwnerOptions: EbitdaKdkmpDataOwner[];
    canSelectDataOwner: boolean;
};

type BusinessProcessFormData = {
    name: string;
    unit_name: string;
    unit_code: string;
    steps: Array<{
        sequence: number;
        process_group: string;
        detail_process: string;
        pic: string;
        standard_time_minutes: number;
        output_target: string;
        responsibility_value: number | null;
    }>;
};

type MatrixRowProps = {
    label: string;
    steps: BusinessProcessStep[];
    value: (step: BusinessProcessStep) => ReactNode;
    cellClassName?: string;
    labelClassName?: string;
    showTotal?: boolean;
    total?: ReactNode;
};

const positionRows = [
    'Kepala Toko',
    'Asisten Kepala Toko',
    'Staf Gudang & Logistik',
    'Pramuniaga',
    'Kasir',
    '',
    '',
];

const labelCellClassName =
    'border border-black bg-[#d9d9d9] px-1.5 py-0.5 text-left align-top font-semibold';

const valueCellClassName =
    'border border-black bg-[#fffecb] px-1.5 py-0.5 text-center align-top font-normal';

function formDataFrom(
    businessProcess: BusinessProcess,
): BusinessProcessFormData {
    return {
        name: businessProcess.name,
        unit_name: businessProcess.unit_name ?? '',
        unit_code: businessProcess.unit_code ?? '',
        steps: businessProcess.steps.map((step) => ({
            sequence: step.sequence,
            process_group: step.process_group,
            detail_process: step.detail_process,
            pic: step.pic,
            standard_time_minutes: step.standard_time_minutes,
            output_target: step.output_target ?? '',
            responsibility_value: step.responsibility_value,
        })),
    };
}

function MatrixRow({
    label,
    steps,
    value,
    cellClassName = '',
    labelClassName = '',
    showTotal = false,
    total = null,
}: MatrixRowProps) {
    return (
        <tr>
            <th
                scope="row"
                className={`${labelCellClassName} ${labelClassName}`}
            >
                {label}
            </th>

            {steps.map((step) => (
                <td
                    key={`${label}-${step.sequence}`}
                    className={`${valueCellClassName} ${cellClassName}`}
                >
                    {value(step)}
                </td>
            ))}

            {showTotal ? (
                <td className={`${valueCellClassName} font-semibold`}>
                    {total}
                </td>
            ) : (
                <td
                    aria-hidden
                    className="border border-transparent bg-white"
                />
            )}
        </tr>
    );
}

function BlankPositionRows({ steps }: { steps: BusinessProcessStep[] }) {
    return positionRows.map((position, rowIndex) => (
        <MatrixRow
            key={`${position || 'blank'}-${rowIndex}`}
            label={position}
            steps={steps}
            value={() => null}
            cellClassName="h-6"
        />
    ));
}

export default function KdkmpGeraiBusinessProcess({
    businessProcess,
    totalStandardTimeMinutes,
    can,
    dataOwner,
    dataOwnerOptions,
    canSelectDataOwner,
}: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<BusinessProcessFormData>(formDataFrom(businessProcess));
    const isPersisted = businessProcess.id !== null;
    const unitLabel = [businessProcess.unit_name, businessProcess.unit_code]
        .filter(Boolean)
        .join(' / ');

    const openForm = () => {
        clearErrors();
        setData(formDataFrom(businessProcess));
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
            kdkmpGeraiBusinessProcessIndex({ query: { owner: username } }),
            { preserveScroll: true },
        );
    };

    const updateStep = <
        Key extends keyof BusinessProcessFormData['steps'][number],
    >(
        index: number,
        key: Key,
        value: BusinessProcessFormData['steps'][number][Key],
    ) => {
        setData(
            'steps',
            data.steps.map((step, stepIndex) =>
                stepIndex === index ? { ...step, [key]: value } : step,
            ),
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (businessProcess.id !== null) {
            put(updateBusinessProcess.url(businessProcess.id), options);

            return;
        }

        post(storeBusinessProcess.url(), options);
    };

    return (
        <>
            <Head title="Business Process KDKMP Gerai" />

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
                        <div className="flex min-w-max items-stretch gap-4 p-5 font-sans text-[10px] leading-tight text-black">
                            <div className="w-10 shrink-0 bg-[#a6e2ba] pt-1 text-center text-base font-semibold underline">
                                1
                            </div>

                            <div className="w-[3160px] pb-8">
                                <h1 className="mb-0.5 text-[18px] leading-none font-bold">
                                    {businessProcess.name}
                                </h1>

                                <table className="w-full table-fixed border-collapse">
                                    <colgroup>
                                        <col className="w-[230px]" />
                                        {businessProcess.steps.map((step) => (
                                            <col
                                                key={step.sequence}
                                                className="w-[170px]"
                                            />
                                        ))}
                                        <col className="w-[70px]" />
                                    </colgroup>

                                    <tbody>
                                        <MatrixRow
                                            label="No."
                                            steps={businessProcess.steps}
                                            value={(step) => step.sequence}
                                        />
                                        <MatrixRow
                                            label="Unit Kerja / Kode Unit"
                                            steps={businessProcess.steps}
                                            value={() => unitLabel}
                                        />
                                        <MatrixRow
                                            label="Urutan Langkah Bisnis Proses"
                                            steps={businessProcess.steps}
                                            value={(step) => step.process_group}
                                            cellClassName="h-12"
                                        />
                                        <MatrixRow
                                            label="Detail Process"
                                            steps={businessProcess.steps}
                                            value={(step) =>
                                                step.detail_process
                                            }
                                            cellClassName="h-36"
                                        />
                                        <MatrixRow
                                            label="Penanggung Jawab Spesifik (PIC)"
                                            steps={businessProcess.steps}
                                            value={(step) => step.pic}
                                        />
                                        <MatrixRow
                                            label="Standar Waktu Rata-rata (Menit)"
                                            steps={businessProcess.steps}
                                            value={(step) =>
                                                step.standard_time_minutes
                                            }
                                            showTotal
                                            total={totalStandardTimeMinutes}
                                        />
                                        <MatrixRow
                                            label="Output / Target Hasil"
                                            steps={businessProcess.steps}
                                            value={(step) =>
                                                step.output_target ?? ''
                                            }
                                            cellClassName="h-7"
                                        />

                                        <tr aria-hidden>
                                            <td colSpan={19} className="h-3" />
                                        </tr>

                                        <MatrixRow
                                            label="Tugas Dan Tanggung Jawab"
                                            steps={businessProcess.steps}
                                            value={(step) =>
                                                step.responsibility_value
                                            }
                                            labelClassName="font-bold"
                                        />
                                        <BlankPositionRows
                                            steps={businessProcess.steps}
                                        />

                                        <tr aria-hidden>
                                            <td colSpan={19} className="h-5" />
                                        </tr>

                                        <MatrixRow
                                            label="KPI"
                                            steps={businessProcess.steps}
                                            value={() => null}
                                            labelClassName="font-bold"
                                        />
                                        <BlankPositionRows
                                            steps={businessProcess.steps}
                                        />
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
                <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] min-w-0 overflow-hidden sm:max-w-[95vw]">
                    <form
                        onSubmit={submit}
                        className="flex max-h-[86vh] min-h-0 w-full min-w-0 flex-col overflow-hidden"
                    >
                        <DialogHeader>
                            <DialogTitle>
                                {isPersisted
                                    ? 'Edit Business Process'
                                    : 'Isi Business Process'}
                            </DialogTitle>
                            <DialogDescription>
                                Isi 17 langkah proses. Total waktu dihitung dari
                                seluruh standar waktu langkah.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 min-h-0 min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto pr-1">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="business-process-name">
                                        Nama
                                    </Label>
                                    <Input
                                        id="business-process-name"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="business-process-unit-name">
                                        Unit Kerja
                                    </Label>
                                    <Input
                                        id="business-process-unit-name"
                                        value={data.unit_name}
                                        onChange={(event) =>
                                            setData(
                                                'unit_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="business-process-unit-code">
                                        Kode Unit
                                    </Label>
                                    <Input
                                        id="business-process-unit-code"
                                        value={data.unit_code}
                                        onChange={(event) =>
                                            setData(
                                                'unit_code',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {Object.keys(errors).length > 0 && (
                                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                    Periksa kembali field langkah yang wajib
                                    diisi.
                                </p>
                            )}

                            <div className="max-h-[58vh] w-full max-w-full overflow-auto rounded-md border">
                                <table className="w-[1700px] table-fixed border-collapse text-sm">
                                    <thead className="sticky top-0 z-10 bg-muted">
                                        <tr>
                                            <th className="w-14 border p-2">
                                                No
                                            </th>
                                            <th className="w-64 border p-2">
                                                Kelompok Proses
                                            </th>
                                            <th className="w-[480px] border p-2">
                                                Detail Process
                                            </th>
                                            <th className="w-64 border p-2">
                                                PIC
                                            </th>
                                            <th className="w-32 border p-2">
                                                Waktu
                                            </th>
                                            <th className="w-72 border p-2">
                                                Output / Target
                                            </th>
                                            <th className="w-40 border p-2">
                                                Tanggung Jawab
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.steps.map((step, index) => (
                                            <tr key={step.sequence}>
                                                <td className="border p-2 text-center align-top font-medium">
                                                    {step.sequence}
                                                </td>
                                                <td className="border p-2 align-top">
                                                    <textarea
                                                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        value={
                                                            step.process_group
                                                        }
                                                        onChange={(event) =>
                                                            updateStep(
                                                                index,
                                                                'process_group',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        rows={4}
                                                    />
                                                </td>
                                                <td className="border p-2 align-top">
                                                    <textarea
                                                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        value={
                                                            step.detail_process
                                                        }
                                                        onChange={(event) =>
                                                            updateStep(
                                                                index,
                                                                'detail_process',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        rows={4}
                                                    />
                                                </td>
                                                <td className="border p-2 align-top">
                                                    <textarea
                                                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        value={step.pic}
                                                        onChange={(event) =>
                                                            updateStep(
                                                                index,
                                                                'pic',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        rows={4}
                                                    />
                                                </td>
                                                <td className="border p-2 align-top">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={
                                                            step.standard_time_minutes
                                                        }
                                                        onChange={(event) =>
                                                            updateStep(
                                                                index,
                                                                'standard_time_minutes',
                                                                Number(
                                                                    event.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="border p-2 align-top">
                                                    <textarea
                                                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        value={
                                                            step.output_target
                                                        }
                                                        onChange={(event) =>
                                                            updateStep(
                                                                index,
                                                                'output_target',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        rows={4}
                                                    />
                                                </td>
                                                <td className="border p-2 align-top">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={
                                                            step.responsibility_value ??
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            updateStep(
                                                                index,
                                                                'responsibility_value',
                                                                event.target
                                                                    .value ===
                                                                    ''
                                                                    ? null
                                                                    : Number(
                                                                          event
                                                                              .target
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

KdkmpGeraiBusinessProcess.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Business Process KDKMP Gerai',
            href: kdkmpGeraiBusinessProcessIndex(),
        },
    ],
};
