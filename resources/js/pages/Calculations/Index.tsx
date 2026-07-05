import { Head, router } from '@inertiajs/react';
import {
    Calculator,
    Database,
    Eye,
    Factory,
    Filter,
    Layers,
    Search,
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';
import { index as calculationsIndex } from '@/routes/calculations';
import type {
    CalculationFilters,
    CalculationItem,
    CalculationSummary,
} from '@/types/calculation';

type Props = {
    calculations: CalculationItem[];
    summary: CalculationSummary;
    classifications: string[];
    filters: CalculationFilters;
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
        </div>
    );
}

export default function CalculationIndex({
    calculations,
    summary,
    classifications,
    filters,
}: Props) {
    const [selectedCalculation, setSelectedCalculation] =
        useState<CalculationItem | null>(null);

    const [form, setForm] = useState({
        year: String(filters.year ?? new Date().getFullYear()),
        scenario: filters.scenario ?? 'target_tahunan',
        search: filters.search ?? '',
        classification: filters.classification ?? 'all',
    });

    const submit = (event: FormEvent) => {
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

    return (
        <>
            <Head title="Kalkulasi EBITDA" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-sm font-semibold text-primary uppercase">
                            Menu Kalkulasi
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
                                onSubmit={submit}
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
                                            <th className="w-[120px] p-4 text-right">
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
                                                        item.total_cost,
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.doc_variable,
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(
                                                        item.doc_fixed,
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    {formatCurrency(item.ioc)}
                                                </td>

                                                <td className="p-4 text-right">
                                                    <Button
                                                        type="button"
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
                                                </td>
                                            </tr>
                                        ))}

                                        {calculations.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={12}
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
                                    </div>
                                </section>

                                <section className="rounded-lg border bg-card p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-foreground">
                                        Breakdown 4M
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
                                        Breakdown DOC-V, DOC-F, dan IOC
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
