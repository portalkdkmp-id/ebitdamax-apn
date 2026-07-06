import { Head, router, useForm } from '@inertiajs/react';
import {
    Calculator,
    Database,
    Eye,
    Factory,
    Filter,
    Layers,
    Pencil,
    Plus,
    Search,
    Trash2,
    WalletCards,
} from 'lucide-react';
import type { ElementType, FormEvent } from 'react';
import { useState } from 'react';
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
import { formatCurrency, formatPercent } from '@/lib/formatters';
import {
    destroy as destroyCalculation,
    index as calculationsIndex,
    store as storeCalculation,
    update as updateCalculation,
} from '@/routes/calculations';
import type {
    CalculationFilters,
    CalculationItem,
    CalculationSummary,
} from '@/types/calculation';
import type { OrganizationOption } from '@/types/ebitda';

type Props = {
    calculations: CalculationItem[];
    organizations: OrganizationOption[];
    summary: CalculationSummary;
    classifications: string[];
    filters: CalculationFilters;
};

type CalculationFormData = {
    organization_id: string;
    year: string;
    period_date: string;
    scenario: string;
    revenue: string;
    classification: string;
    man_cost: string;
    method_cost: string;
    material_cost: string;
    machine_cost: string;
    doc_variable: string;
    doc_fixed: string;
    ioc: string;
    source_sheet: string;
};

type StatCardProps = {
    title: string;
    value: string | number;
    icon: ElementType;
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

function createDefaultForm(filters: CalculationFilters): CalculationFormData {
    return {
        organization_id: '',
        year: String(filters.year ?? new Date().getFullYear()),
        period_date: '',
        scenario: filters.scenario ?? 'target_tahunan',
        revenue: '0',
        classification: '',
        man_cost: '0',
        method_cost: '0',
        material_cost: '0',
        machine_cost: '0',
        doc_variable: '0',
        doc_fixed: '0',
        ioc: '0',
        source_sheet: 'Manual Calculation CRUD',
    };
}

function toFormData(item: CalculationItem): CalculationFormData {
    return {
        organization_id: String(item.organization_id),
        year: String(item.year),
        period_date: item.period_date ?? '',
        scenario: item.scenario,
        revenue: toInputValue(item.revenue),
        classification: item.classification ?? '',
        man_cost: toInputValue(item.man_cost),
        method_cost: toInputValue(item.method_cost),
        material_cost: toInputValue(item.material_cost),
        machine_cost: toInputValue(item.machine_cost),
        doc_variable: toInputValue(item.doc_variable),
        doc_fixed: toInputValue(item.doc_fixed),
        ioc: toInputValue(item.ioc),
        source_sheet: item.source_sheet ?? 'Manual Calculation CRUD',
    };
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}

function sourceLabel(valueSource: CalculationItem['value_source']) {
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

function StatCard({ title, value, icon: Icon }: StatCardProps) {
    return (
        <Card className="rounded-lg border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-1 text-xl font-semibold text-primary">
                        {value}
                    </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    <Icon className="size-5" />
                </div>
            </CardContent>
        </Card>
    );
}

function DetailRow({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
                className={`text-right text-sm font-semibold ${
                    highlight ? 'text-primary' : 'text-foreground'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

function CostCompositionBar({ item }: { item: CalculationItem }) {
    const total = item.total_cost || 0;

    const manPct = total > 0 ? (item.man_cost / total) * 100 : 0;
    const methodPct = total > 0 ? (item.method_cost / total) * 100 : 0;
    const materialPct = total > 0 ? (item.material_cost / total) * 100 : 0;
    const machinePct = total > 0 ? (item.machine_cost / total) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="h-3 overflow-hidden rounded-full bg-primary/10">
                <div className="flex h-full w-full">
                    <div
                        className="bg-primary"
                        style={{ width: `${manPct}%` }}
                    />
                    <div
                        className="bg-primary/75"
                        style={{ width: `${methodPct}%` }}
                    />
                    <div
                        className="bg-primary/45"
                        style={{ width: `${materialPct}%` }}
                    />
                    <div
                        className="bg-primary/20"
                        style={{ width: `${machinePct}%` }}
                    />
                </div>
            </div>

            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <span>Man {manPct.toFixed(1)}%</span>
                <span>Method {methodPct.toFixed(1)}%</span>
                <span>Material {materialPct.toFixed(1)}%</span>
                <span>Machine {machinePct.toFixed(1)}%</span>
            </div>
        </div>
    );
}

function DocCompositionBar({ item }: { item: CalculationItem }) {
    const total = item.total_cost || 0;

    const docVPct = total > 0 ? (item.doc_variable / total) * 100 : 0;
    const docFPct = total > 0 ? (item.doc_fixed / total) * 100 : 0;
    const iocPct = total > 0 ? (item.ioc / total) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="h-3 overflow-hidden rounded-full bg-primary/10">
                <div className="flex h-full w-full">
                    <div
                        className="bg-primary"
                        style={{ width: `${docVPct}%` }}
                    />
                    <div
                        className="bg-primary/65"
                        style={{ width: `${docFPct}%` }}
                    />
                    <div
                        className="bg-primary/30"
                        style={{ width: `${iocPct}%` }}
                    />
                </div>
            </div>

            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>DOC-V {docVPct.toFixed(1)}%</span>
                <span>DOC-F {docFPct.toFixed(1)}%</span>
                <span>IOC {iocPct.toFixed(1)}%</span>
            </div>
        </div>
    );
}

function OrganizationBadges({ item }: { item: CalculationItem }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
                {item.code ?? '-'}
            </Badge>

            {item.is_revenue_center ? (
                <Badge className="bg-primary text-primary-foreground">
                    Revenue Center
                </Badge>
            ) : (
                <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                >
                    Cost Center
                </Badge>
            )}

            <Badge
                variant="outline"
                className="border-border bg-background text-muted-foreground"
            >
                Nilai input
            </Badge>

            {item.value_source === 'calculated_from_children' && (
                <Badge className="bg-primary text-primary-foreground">
                    Roll-up dashboard
                </Badge>
            )}
        </div>
    );
}

export default function CalculationIndex({
    calculations,
    organizations,
    summary,
    classifications,
    filters,
}: Props) {
    const [selectedCalculation, setSelectedCalculation] =
        useState<CalculationItem | null>(null);
    const [selectedItem, setSelectedItem] = useState<CalculationItem | null>(
        null,
    );
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [form, setForm] = useState({
        year: String(filters.year ?? new Date().getFullYear()),
        scenario: filters.scenario ?? 'target_tahunan',
        search: filters.search ?? '',
        classification: filters.classification ?? 'all',
    });

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<CalculationFormData>(createDefaultForm(filters));

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            calculationsIndex.url(),
            {
                year: form.year,
                scenario: form.scenario,
                search: form.search,
                classification: form.classification,
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

    const openEditForm = (item: CalculationItem) => {
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
            put(updateCalculation.url(selectedItem.id), options);

            return;
        }

        post(storeCalculation.url(), options);
    };

    const destroy = (item: CalculationItem) => {
        if (!confirm(`Yakin ingin menghapus kalkulasi ${item.code ?? ''}?`)) {
            return;
        }

        router.delete(destroyCalculation.url(item.id), {
            preserveScroll: true,
        });
    };

    const previewToc =
        Number(data.doc_variable || 0) +
        Number(data.doc_fixed || 0) +
        Number(data.ioc || 0);
    const previewEbitda = Number(data.revenue || 0) - previewToc;
    const previewMargin =
        Number(data.revenue || 0) > 0
            ? (previewEbitda / Number(data.revenue || 0)) * 100
            : null;

    return (
        <>
            <Head title="Kalkulasi EBITDA" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                CRUD Kalkulasi
                            </p>

                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Data Tabel Kalkulasi EBITDA
                            </h1>

                            <p className="mt-2 max-w-4xl text-muted-foreground">
                                Ringkasan dan rincian cost structure dari tabel
                                EBITDA Values.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Badge className="bg-primary text-primary-foreground">
                                    Tahun {filters.year}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-primary/25 bg-primary/5 text-primary"
                                >
                                    Scenario: {filters.scenario}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-primary/25 bg-primary/5 text-primary"
                                >
                                    Source: ebitda_values
                                </Badge>
                            </div>
                        </div>

                        <Button type="button" onClick={openCreateForm}>
                            <Plus className="size-4" />
                            Tambah Kalkulasi
                        </Button>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Total Row"
                            value={summary.total_rows}
                            icon={Database}
                        />

                        <StatCard
                            title="Total Cost / TOC"
                            value={formatCurrency(summary.total_cost)}
                            icon={Calculator}
                        />

                        <StatCard
                            title="DOC Variable"
                            value={formatCurrency(summary.total_doc_variable)}
                            icon={Layers}
                        />

                        <StatCard
                            title="DOC Fixed + IOC"
                            value={formatCurrency(
                                summary.total_doc_fixed + summary.total_ioc,
                            )}
                            icon={WalletCards}
                        />
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Man Cost"
                            value={formatCurrency(summary.total_man_cost)}
                            icon={Factory}
                        />

                        <StatCard
                            title="Method Cost"
                            value={formatCurrency(summary.total_method_cost)}
                            icon={Filter}
                        />

                        <StatCard
                            title="Material Cost"
                            value={formatCurrency(summary.total_material_cost)}
                            icon={Layers}
                        />

                        <StatCard
                            title="Machine Cost"
                            value={formatCurrency(summary.total_machine_cost)}
                            icon={WalletCards}
                        />
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardContent className="p-5">
                            <form
                                onSubmit={submitFilters}
                                className="grid gap-4 md:grid-cols-[140px_220px_1fr_240px_auto]"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Tahun
                                    </label>

                                    <Input
                                        type="number"
                                        value={form.year}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                year: event.target.value,
                                            }))
                                        }
                                        className="h-10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Scenario
                                    </label>

                                    <select
                                        value={form.scenario}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                scenario: event.target.value,
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
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

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Search
                                    </label>

                                    <div className="relative">
                                        <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                                        <Input
                                            value={form.search}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    search: event.target.value,
                                                }))
                                            }
                                            placeholder="Cari kode, unit, level, atau klasifikasi"
                                            className="h-10 pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Klasifikasi
                                    </label>

                                    <select
                                        value={form.classification}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                classification:
                                                    event.target.value,
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                    >
                                        <option value="all">
                                            Semua Klasifikasi
                                        </option>

                                        {classifications.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
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
                            <CardTitle className="text-foreground">
                                Tabel Kalkulasi
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                                            <th className="min-w-[300px] p-4">
                                                Unit
                                            </th>
                                            <th className="min-w-[180px] p-4">
                                                Klasifikasi
                                            </th>
                                            <th className="min-w-[140px] p-4">
                                                Scenario
                                            </th>
                                            <th className="p-4 text-right">
                                                Revenue
                                            </th>
                                            <th className="p-4 text-right">
                                                Man
                                            </th>
                                            <th className="p-4 text-right">
                                                Method
                                            </th>
                                            <th className="p-4 text-right">
                                                Material
                                            </th>
                                            <th className="p-4 text-right">
                                                Machine
                                            </th>
                                            <th className="p-4 text-right">
                                                TOC
                                            </th>
                                            <th className="p-4 text-right">
                                                DOC-V
                                            </th>
                                            <th className="p-4 text-right">
                                                DOC-F
                                            </th>
                                            <th className="p-4 text-right">
                                                IOC
                                            </th>
                                            <th className="w-[280px] p-4 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {calculations.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b align-top transition-colors hover:bg-muted/30"
                                            >
                                                <td className="p-4">
                                                    <OrganizationBadges
                                                        item={item}
                                                    />

                                                    <div className="mt-2 font-medium text-foreground">
                                                        {item.name ?? '-'}
                                                    </div>

                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        {item.level ?? '-'}
                                                    </div>

                                                    {item.directorate_group && (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            {
                                                                item.directorate_group
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="p-4">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-primary/25 bg-primary/5 text-primary"
                                                    >
                                                        {item.classification ??
                                                            '-'}
                                                    </Badge>
                                                </td>

                                                <td className="p-4 text-muted-foreground">
                                                    {item.scenario}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.resolved_value
                                                            .revenue,
                                                    )}
                                                    {item.value_source ===
                                                        'calculated_from_children' && (
                                                        <SourceValueHint
                                                            value={formatCurrency(
                                                                item.revenue,
                                                            )}
                                                        />
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.man_cost,
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.method_cost,
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.material_cost,
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.machine_cost,
                                                    )}
                                                </td>

                                                <td className="p-4 text-right font-semibold text-foreground">
                                                    {formatCurrency(
                                                        item.resolved_value.toc,
                                                    )}
                                                    {item.value_source ===
                                                        'calculated_from_children' && (
                                                        <SourceValueHint
                                                            value={formatCurrency(
                                                                item.total_cost,
                                                            )}
                                                        />
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.resolved_value
                                                            .doc_variable,
                                                    )}
                                                    {item.value_source ===
                                                        'calculated_from_children' && (
                                                        <SourceValueHint
                                                            value={formatCurrency(
                                                                item.doc_variable,
                                                            )}
                                                        />
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.resolved_value
                                                            .doc_fixed,
                                                    )}
                                                    {item.value_source ===
                                                        'calculated_from_children' && (
                                                        <SourceValueHint
                                                            value={formatCurrency(
                                                                item.doc_fixed,
                                                            )}
                                                        />
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.resolved_value.ioc,
                                                    )}
                                                    {item.value_source ===
                                                        'calculated_from_children' && (
                                                        <SourceValueHint
                                                            value={formatCurrency(
                                                                item.ioc,
                                                            )}
                                                        />
                                                    )}
                                                </td>

                                                <td className="p-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setSelectedCalculation(
                                                                    item,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="size-4" />
                                                            Detail
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    item,
                                                                )
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
                                                </td>
                                            </tr>
                                        ))}

                                        {calculations.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={13}
                                                    className="p-8 text-center text-muted-foreground"
                                                >
                                                    Data kalkulasi belum
                                                    tersedia.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
                                    ? 'Edit Kalkulasi'
                                    : 'Tambah Kalkulasi'}
                            </DialogTitle>
                            <DialogDescription>
                                Form ini mengubah source row. Nilai TOC, EBITDA,
                                dan margin dihitung otomatis dari revenue,
                                DOC-V, DOC-F, dan IOC.
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
                                label="Source Sheet"
                                value={data.source_sheet}
                                onChange={(value) =>
                                    setData('source_sheet', value)
                                }
                                error={errors.source_sheet}
                            />
                        </div>

                        <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-3">
                            <DetailRow
                                label="Preview TOC"
                                value={formatCurrency(previewToc)}
                            />
                            <DetailRow
                                label="Preview EBITDA"
                                value={formatCurrency(previewEbitda)}
                                highlight
                            />
                            <DetailRow
                                label="Preview Margin"
                                value={
                                    previewMargin === null
                                        ? 'N/A'
                                        : `${previewMargin.toFixed(2)}%`
                                }
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
                open={selectedCalculation !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedCalculation(null);
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
                    {selectedCalculation && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-foreground">
                                    Detail Kalkulasi
                                </DialogTitle>
                                <DialogDescription>
                                    Breakdown biaya dan validasi formula untuk
                                    unit organisasi terpilih.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5">
                                <section className="rounded-lg border bg-card p-4">
                                    <OrganizationBadges
                                        item={selectedCalculation}
                                    />

                                    <h2 className="mt-3 text-xl font-semibold text-foreground">
                                        {selectedCalculation.name ?? '-'}
                                    </h2>

                                    <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                                        <p>
                                            Source:{' '}
                                            {selectedCalculation.source_sheet ??
                                                '-'}
                                        </p>
                                        <p>
                                            Tahun / Scenario:{' '}
                                            <span className="font-medium text-foreground">
                                                {selectedCalculation.year} /{' '}
                                                {selectedCalculation.scenario}
                                            </span>
                                        </p>
                                        <p>
                                            Klasifikasi:{' '}
                                            <span className="font-medium text-foreground">
                                                {selectedCalculation.classification ??
                                                    '-'}
                                            </span>
                                        </p>
                                        <p>
                                            Mode:{' '}
                                            <span className="font-medium text-foreground">
                                                {sourceLabel(
                                                    selectedCalculation.value_source,
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </section>

                                {selectedCalculation.value_source ===
                                    'calculated_from_children' && (
                                    <section className="rounded-lg border bg-card p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-foreground">
                                            Nilai Dashboard Roll-up
                                        </h3>

                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                            <DetailRow
                                                label="Revenue"
                                                value={formatCurrency(
                                                    selectedCalculation
                                                        .resolved_value.revenue,
                                                )}
                                            />
                                            <DetailRow
                                                label="TOC"
                                                value={formatCurrency(
                                                    selectedCalculation
                                                        .resolved_value.toc,
                                                )}
                                            />
                                            <DetailRow
                                                label="EBITDA"
                                                value={formatCurrency(
                                                    selectedCalculation
                                                        .resolved_value.ebitda,
                                                )}
                                                highlight
                                            />
                                            <DetailRow
                                                label="Margin"
                                                value={formatPercent(
                                                    selectedCalculation
                                                        .resolved_value
                                                        .ebitda_margin,
                                                )}
                                            />
                                        </div>
                                    </section>
                                )}

                                <section className="rounded-lg border bg-card p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-foreground">
                                        Breakdown 4M Source Row
                                    </h3>

                                    <div className="mt-4 space-y-4">
                                        <CostCompositionBar
                                            item={selectedCalculation}
                                        />

                                        <div className="grid gap-3 md:grid-cols-2">
                                            <DetailRow
                                                label="Man Cost"
                                                value={formatCurrency(
                                                    selectedCalculation.man_cost,
                                                )}
                                            />
                                            <DetailRow
                                                label="Method Cost"
                                                value={formatCurrency(
                                                    selectedCalculation.method_cost,
                                                )}
                                            />
                                            <DetailRow
                                                label="Material Cost"
                                                value={formatCurrency(
                                                    selectedCalculation.material_cost,
                                                )}
                                            />
                                            <DetailRow
                                                label="Machine Cost"
                                                value={formatCurrency(
                                                    selectedCalculation.machine_cost,
                                                )}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-lg border bg-card p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-foreground">
                                        Breakdown DOC-V, DOC-F, dan IOC Source
                                        Row
                                    </h3>

                                    <div className="mt-4 space-y-4">
                                        <DocCompositionBar
                                            item={selectedCalculation}
                                        />

                                        <div className="grid gap-3 md:grid-cols-2">
                                            <DetailRow
                                                label="DOC Variable"
                                                value={formatCurrency(
                                                    selectedCalculation.doc_variable,
                                                )}
                                            />
                                            <DetailRow
                                                label="DOC Fixed"
                                                value={formatCurrency(
                                                    selectedCalculation.doc_fixed,
                                                )}
                                            />
                                            <DetailRow
                                                label="IOC"
                                                value={formatCurrency(
                                                    selectedCalculation.ioc,
                                                )}
                                            />
                                            <DetailRow
                                                label="Total Cost / TOC"
                                                value={formatCurrency(
                                                    selectedCalculation.total_cost,
                                                )}
                                                highlight
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-lg border bg-card p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-foreground">
                                        Validasi Formula
                                    </h3>

                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                        <DetailRow
                                            label="Man + Method + Material + Machine"
                                            value={formatCurrency(
                                                selectedCalculation.man_cost +
                                                    selectedCalculation.method_cost +
                                                    selectedCalculation.material_cost +
                                                    selectedCalculation.machine_cost,
                                            )}
                                        />
                                        <DetailRow
                                            label="DOC-V + DOC-F + IOC"
                                            value={formatCurrency(
                                                selectedCalculation.doc_variable +
                                                    selectedCalculation.doc_fixed +
                                                    selectedCalculation.ioc,
                                            )}
                                        />
                                    </div>
                                </section>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

CalculationIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Kalkulasi',
            href: calculationsIndex(),
        },
    ],
};
