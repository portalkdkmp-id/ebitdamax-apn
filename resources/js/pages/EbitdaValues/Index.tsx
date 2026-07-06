import { Head, router, useForm } from '@inertiajs/react';
import {
    Calculator,
    Eye,
    Pencil,
    Plus,
    Search,
    Trash2,
    WalletCards,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
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
import { formatCurrency, formatPercent } from '@/lib/formatters';
import {
    destroy as destroyEbitdaValue,
    index as ebitdaValuesIndex,
    store as storeEbitdaValue,
    update as updateEbitdaValue,
} from '@/routes/ebitda-values';
import type {
    EbitdaValueFilters,
    EbitdaValueItem,
    OrganizationOption,
    PaginatedResponse,
} from '@/types/ebitda';

type Props = {
    values: PaginatedResponse<EbitdaValueItem>;
    organizations: OrganizationOption[];
    filters: EbitdaValueFilters;
};

type EbitdaFormData = {
    organization_id: string;
    year: string;
    period_date: string;
    scenario: string;
    revenue: string;
    doc_variable: string;
    doc_fixed: string;
    ioc: string;
    classification: string;
    man_cost: string;
    method_cost: string;
    material_cost: string;
    machine_cost: string;
    source_sheet: string;
};

const scenarioOptions = [
    { value: 'target_tahunan', label: 'Target Tahunan' },
    { value: 'target_harian', label: 'Target Harian' },
    { value: 'plan_harian', label: 'Plan Harian' },
    { value: 'aktual_harian', label: 'Aktual Harian' },
];

function toInputValue(value: number | string | null | undefined) {
    return value === null || value === undefined ? '' : String(value);
}

function createDefaultForm(filters: EbitdaValueFilters): EbitdaFormData {
    return {
        organization_id: '',
        year: String(filters.year ?? new Date().getFullYear()),
        period_date: '',
        scenario: filters.scenario ?? 'target_tahunan',
        revenue: '0',
        doc_variable: '0',
        doc_fixed: '0',
        ioc: '0',
        classification: '',
        man_cost: '0',
        method_cost: '0',
        material_cost: '0',
        machine_cost: '0',
        source_sheet: 'Manual CRUD',
    };
}

function toFormData(item: EbitdaValueItem): EbitdaFormData {
    return {
        organization_id: String(item.organization_id),
        year: String(item.year),
        period_date: item.period_date ?? '',
        scenario: item.scenario,
        revenue: toInputValue(item.revenue),
        doc_variable: toInputValue(item.doc_variable),
        doc_fixed: toInputValue(item.doc_fixed),
        ioc: toInputValue(item.ioc),
        classification: item.classification ?? '',
        man_cost: toInputValue(item.man_cost),
        method_cost: toInputValue(item.method_cost),
        material_cost: toInputValue(item.material_cost),
        machine_cost: toInputValue(item.machine_cost),
        source_sheet: item.source_sheet ?? 'Manual CRUD',
    };
}

function fieldNumber(value: string) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}

function sourceLabel(valueSource: EbitdaValueItem['value_source']) {
    if (valueSource === 'calculated_from_children') {
        return 'Nilai dashboard: roll-up';
    }

    if (valueSource === 'excel') {
        return 'Nilai dashboard: input';
    }

    return 'Nilai dashboard: kosong';
}

function SourceValueHint({ value }: { value: string }) {
    return (
        <div className="mt-1 text-xs text-muted-foreground">
            Nilai input: {value}
        </div>
    );
}

function TextField({
    label,
    value,
    onChange,
    type = 'text',
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    error?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <FieldError message={error} />
        </div>
    );
}

function DetailMetric({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
                className={`mt-1 text-lg font-semibold ${
                    highlight ? 'text-primary' : 'text-foreground'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

export default function EbitdaValuesIndex({
    values,
    organizations,
    filters,
}: Props) {
    const [selectedItem, setSelectedItem] = useState<EbitdaValueItem | null>(
        null,
    );
    const [detailItem, setDetailItem] = useState<EbitdaValueItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterForm, setFilterForm] = useState({
        search: filters.search ?? '',
        year: String(filters.year ?? new Date().getFullYear()),
        scenario: filters.scenario ?? 'target_tahunan',
    });

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<EbitdaFormData>(createDefaultForm(filters));

    const calculated = useMemo(() => {
        const revenue = fieldNumber(data.revenue);
        const toc =
            fieldNumber(data.doc_variable) +
            fieldNumber(data.doc_fixed) +
            fieldNumber(data.ioc);
        const ebitda = revenue - toc;
        const margin = revenue > 0 ? (ebitda / revenue) * 100 : null;

        return { toc, ebitda, margin };
    }, [data.doc_fixed, data.doc_variable, data.ioc, data.revenue]);

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            ebitdaValuesIndex.url(),
            {
                search: filterForm.search,
                year: filterForm.year,
                scenario: filterForm.scenario,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const openCreateForm = () => {
        setSelectedItem(null);
        reset();
        clearErrors();
        setData(createDefaultForm(filters));
        setIsFormOpen(true);
    };

    const openEditForm = (item: EbitdaValueItem) => {
        setSelectedItem(item);
        clearErrors();
        setData(toFormData(item));
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setSelectedItem(null);
        reset();
        clearErrors();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (selectedItem) {
            put(updateEbitdaValue.url(selectedItem.id), options);

            return;
        }

        post(storeEbitdaValue.url(), options);
    };

    const destroy = (item: EbitdaValueItem) => {
        if (
            !confirm(
                `Yakin ingin menghapus data EBITDA ${item.organization?.code ?? ''}?`,
            )
        ) {
            return;
        }

        router.delete(destroyEbitdaValue.url(item.id), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="EBITDA Values" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                CRUD EBITDA Values
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                EBITDA Values
                            </h1>
                            <p className="mt-2 max-w-3xl text-muted-foreground">
                                Kelola sumber data utama dashboard, termasuk
                                revenue, DOC-V, DOC-F, IOC, TOC, EBITDA, dan
                                margin otomatis.
                            </p>
                        </div>

                        <Button type="button" onClick={openCreateForm}>
                            <Plus className="size-4" />
                            Tambah Data
                        </Button>
                    </section>

                    <section className="grid gap-4 md:grid-cols-3">
                        <Card className="rounded-lg border bg-card shadow-sm">
                            <CardContent className="flex items-center justify-between gap-4 p-5">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Data
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold text-primary">
                                        {values.total}
                                    </p>
                                </div>
                                <WalletCards className="size-5 text-primary" />
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border bg-card shadow-sm">
                            <CardContent className="flex items-center justify-between gap-4 p-5">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tahun
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold text-primary">
                                        {filters.year}
                                    </p>
                                </div>
                                <Calculator className="size-5 text-primary" />
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border bg-card shadow-sm">
                            <CardContent className="flex items-center justify-between gap-4 p-5">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Scenario
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-primary">
                                        {filters.scenario}
                                    </p>
                                </div>
                                <Badge className="bg-primary text-primary-foreground">
                                    Active
                                </Badge>
                            </CardContent>
                        </Card>
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardContent className="p-5">
                            <form
                                onSubmit={submitFilters}
                                className="grid gap-4 md:grid-cols-[1fr_140px_220px_auto]"
                            >
                                <div className="space-y-2">
                                    <Label>Search organisasi</Label>
                                    <div className="relative">
                                        <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                                        <Input
                                            value={filterForm.search}
                                            onChange={(event) =>
                                                setFilterForm((current) => ({
                                                    ...current,
                                                    search: event.target.value,
                                                }))
                                            }
                                            placeholder="Cari kode, nama, atau level"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <TextField
                                    label="Tahun"
                                    type="number"
                                    value={filterForm.year}
                                    onChange={(value) =>
                                        setFilterForm((current) => ({
                                            ...current,
                                            year: value,
                                        }))
                                    }
                                />

                                <div className="space-y-2">
                                    <Label>Scenario</Label>
                                    <select
                                        value={filterForm.scenario}
                                        onChange={(event) =>
                                            setFilterForm((current) => ({
                                                ...current,
                                                scenario: event.target.value,
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                    >
                                        {scenarioOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <Button type="submit" className="w-full">
                                        Filter
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardHeader className="border-b">
                            <CardTitle>Data EBITDA Values</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="min-w-[280px] p-4">
                                            Organisasi
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Scenario
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            Revenue
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            TOC
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            EBITDA
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            Margin
                                        </TableHead>
                                        <TableHead className="w-[260px] p-4 text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {values.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="p-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge className="bg-primary text-primary-foreground">
                                                        {item.organization
                                                            ?.code ?? '-'}
                                                    </Badge>
                                                    {item.classification && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-primary/25 bg-primary/5 text-primary"
                                                        >
                                                            {
                                                                item.classification
                                                            }
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant="outline"
                                                        className="border-border bg-background text-muted-foreground"
                                                    >
                                                        Nilai input
                                                    </Badge>
                                                    {item.value_source ===
                                                        'calculated_from_children' && (
                                                        <Badge className="bg-primary text-primary-foreground">
                                                            Roll-up dashboard
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-2 font-medium text-foreground">
                                                    {item.organization?.name ??
                                                        '-'}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {item.organization?.level ??
                                                        '-'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="p-4 text-muted-foreground">
                                                {item.year} / {item.scenario}
                                            </TableCell>
                                            <TableCell className="p-4 text-right">
                                                {formatCurrency(
                                                    item.resolved_value.revenue,
                                                )}
                                                {item.value_source ===
                                                    'calculated_from_children' && (
                                                    <SourceValueHint
                                                        value={formatCurrency(
                                                            item.revenue,
                                                        )}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4 text-right">
                                                {formatCurrency(
                                                    item.resolved_value.toc,
                                                )}
                                                {item.value_source ===
                                                    'calculated_from_children' && (
                                                    <SourceValueHint
                                                        value={formatCurrency(
                                                            item.toc,
                                                        )}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4 text-right font-semibold text-primary">
                                                {formatCurrency(
                                                    item.resolved_value.ebitda,
                                                )}
                                                {item.value_source ===
                                                    'calculated_from_children' && (
                                                    <SourceValueHint
                                                        value={formatCurrency(
                                                            item.ebitda,
                                                        )}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4 text-right">
                                                {formatPercent(
                                                    item.resolved_value
                                                        .ebitda_margin,
                                                )}
                                                {item.value_source ===
                                                    'calculated_from_children' && (
                                                    <SourceValueHint
                                                        value={formatPercent(
                                                            item.ebitda_margin,
                                                        )}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDetailItem(item)
                                                        }
                                                    >
                                                        <Eye className="size-4" />
                                                        Detail
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditForm(item)
                                                        }
                                                    >
                                                        <Pencil className="size-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            destroy(item)
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {values.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Data EBITDA belum tersedia.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                <p>
                                    Menampilkan {values.from ?? 0}-
                                    {values.to ?? 0} dari {values.total} data
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {values.links.map((link) => (
                                        <Button
                                            key={`${link.label}-${link.url}`}
                                            type="button"
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
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
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                    <form onSubmit={submit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedItem
                                    ? 'Edit EBITDA Value'
                                    : 'Tambah EBITDA Value'}
                            </DialogTitle>
                            <DialogDescription>
                                Form ini mengubah source row. TOC, EBITDA, dan
                                margin dihitung otomatis dari revenue, DOC-V,
                                DOC-F, dan IOC.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedItem?.value_source ===
                            'calculated_from_children' && (
                            <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm text-foreground">
                                Baris ini tampil di dashboard sebagai roll-up
                                dari child organisasi. Perubahan source row ini
                                tersimpan, namun nilai dashboard parent tetap
                                mengikuti agregasi child.
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Organisasi</Label>
                                <select
                                    value={data.organization_id}
                                    onChange={(event) =>
                                        setData(
                                            'organization_id',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                >
                                    <option value="">Pilih organisasi</option>
                                    {organizations.map((organization) => (
                                        <option
                                            key={organization.id}
                                            value={organization.id}
                                        >
                                            {organization.code} -{' '}
                                            {organization.name}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={errors.organization_id} />
                            </div>

                            <TextField
                                label="Tahun"
                                type="number"
                                value={data.year}
                                onChange={(value) => setData('year', value)}
                                error={errors.year}
                            />

                            <div className="space-y-2">
                                <Label>Scenario</Label>
                                <select
                                    value={data.scenario}
                                    onChange={(event) =>
                                        setData('scenario', event.target.value)
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                >
                                    {scenarioOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={errors.scenario} />
                            </div>

                            <TextField
                                label="Tanggal Periode"
                                type="date"
                                value={data.period_date}
                                onChange={(value) =>
                                    setData('period_date', value)
                                }
                                error={errors.period_date}
                            />

                            <TextField
                                label="Klasifikasi"
                                value={data.classification}
                                onChange={(value) =>
                                    setData('classification', value)
                                }
                                error={errors.classification}
                            />

                            <TextField
                                label="Revenue"
                                type="number"
                                value={data.revenue}
                                onChange={(value) => setData('revenue', value)}
                                error={errors.revenue}
                            />

                            <TextField
                                label="DOC Variable"
                                type="number"
                                value={data.doc_variable}
                                onChange={(value) =>
                                    setData('doc_variable', value)
                                }
                                error={errors.doc_variable}
                            />

                            <TextField
                                label="DOC Fixed"
                                type="number"
                                value={data.doc_fixed}
                                onChange={(value) =>
                                    setData('doc_fixed', value)
                                }
                                error={errors.doc_fixed}
                            />

                            <TextField
                                label="IOC"
                                type="number"
                                value={data.ioc}
                                onChange={(value) => setData('ioc', value)}
                                error={errors.ioc}
                            />

                            <TextField
                                label="Man Cost"
                                type="number"
                                value={data.man_cost}
                                onChange={(value) => setData('man_cost', value)}
                                error={errors.man_cost}
                            />

                            <TextField
                                label="Method Cost"
                                type="number"
                                value={data.method_cost}
                                onChange={(value) =>
                                    setData('method_cost', value)
                                }
                                error={errors.method_cost}
                            />

                            <TextField
                                label="Material Cost"
                                type="number"
                                value={data.material_cost}
                                onChange={(value) =>
                                    setData('material_cost', value)
                                }
                                error={errors.material_cost}
                            />

                            <TextField
                                label="Machine Cost"
                                type="number"
                                value={data.machine_cost}
                                onChange={(value) =>
                                    setData('machine_cost', value)
                                }
                                error={errors.machine_cost}
                            />

                            <TextField
                                label="Source Sheet"
                                value={data.source_sheet}
                                onChange={(value) =>
                                    setData('source_sheet', value)
                                }
                                error={errors.source_sheet}
                            />
                        </div>

                        <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-3">
                            <DetailMetric
                                label="Preview TOC"
                                value={formatCurrency(calculated.toc)}
                            />
                            <DetailMetric
                                label="Preview EBITDA"
                                value={formatCurrency(calculated.ebitda)}
                                highlight
                            />
                            <DetailMetric
                                label="Preview Margin"
                                value={formatPercent(calculated.margin)}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeForm}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={detailItem !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailItem(null);
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
                    {detailItem && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Detail EBITDA Value</DialogTitle>
                                <DialogDescription>
                                    Data lengkap baris EBITDA dan hasil formula.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5">
                                <section className="rounded-lg border bg-card p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className="bg-primary text-primary-foreground">
                                            {detailItem.organization?.code ??
                                                '-'}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="border-primary/25 bg-primary/5 text-primary"
                                        >
                                            {detailItem.year} /{' '}
                                            {detailItem.scenario}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="border-border bg-background text-muted-foreground"
                                        >
                                            {sourceLabel(
                                                detailItem.value_source,
                                            )}
                                        </Badge>
                                    </div>
                                    <h2 className="mt-3 text-xl font-semibold text-foreground">
                                        {detailItem.organization?.name ?? '-'}
                                    </h2>
                                </section>

                                <p className="text-sm font-semibold text-foreground">
                                    Source Row
                                </p>

                                <div className="grid gap-3 md:grid-cols-4">
                                    <DetailMetric
                                        label="Revenue"
                                        value={formatCurrency(
                                            detailItem.revenue,
                                        )}
                                    />
                                    <DetailMetric
                                        label="TOC"
                                        value={formatCurrency(detailItem.toc)}
                                    />
                                    <DetailMetric
                                        label="EBITDA"
                                        value={formatCurrency(
                                            detailItem.ebitda,
                                        )}
                                        highlight
                                    />
                                    <DetailMetric
                                        label="Margin"
                                        value={formatPercent(
                                            detailItem.ebitda_margin,
                                        )}
                                    />
                                </div>

                                {detailItem.value_source ===
                                    'calculated_from_children' && (
                                    <>
                                        <p className="text-sm font-semibold text-foreground">
                                            Nilai Dashboard Roll-up
                                        </p>

                                        <div className="grid gap-3 md:grid-cols-4">
                                            <DetailMetric
                                                label="Revenue"
                                                value={formatCurrency(
                                                    detailItem.resolved_value
                                                        .revenue,
                                                )}
                                            />
                                            <DetailMetric
                                                label="TOC"
                                                value={formatCurrency(
                                                    detailItem.resolved_value
                                                        .toc,
                                                )}
                                            />
                                            <DetailMetric
                                                label="EBITDA"
                                                value={formatCurrency(
                                                    detailItem.resolved_value
                                                        .ebitda,
                                                )}
                                                highlight
                                            />
                                            <DetailMetric
                                                label="Margin"
                                                value={formatPercent(
                                                    detailItem.resolved_value
                                                        .ebitda_margin,
                                                )}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="grid gap-3 md:grid-cols-3">
                                    <DetailMetric
                                        label="DOC Variable"
                                        value={formatCurrency(
                                            detailItem.doc_variable,
                                        )}
                                    />
                                    <DetailMetric
                                        label="DOC Fixed"
                                        value={formatCurrency(
                                            detailItem.doc_fixed,
                                        )}
                                    />
                                    <DetailMetric
                                        label="IOC"
                                        value={formatCurrency(detailItem.ioc)}
                                    />
                                </div>

                                <div className="grid gap-3 md:grid-cols-4">
                                    <DetailMetric
                                        label="Man"
                                        value={formatCurrency(
                                            detailItem.man_cost,
                                        )}
                                    />
                                    <DetailMetric
                                        label="Method"
                                        value={formatCurrency(
                                            detailItem.method_cost,
                                        )}
                                    />
                                    <DetailMetric
                                        label="Material"
                                        value={formatCurrency(
                                            detailItem.material_cost,
                                        )}
                                    />
                                    <DetailMetric
                                        label="Machine"
                                        value={formatCurrency(
                                            detailItem.machine_cost,
                                        )}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

EbitdaValuesIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'EBITDA Values',
            href: ebitdaValuesIndex(),
        },
    ],
};
