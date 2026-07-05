import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    ChevronDown,
    ChevronRight,
    CircleDot,
    Eye,
    Network,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import type { ElementType, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    destroy as destroyOrganization,
    index as organizationsIndex,
    store as storeOrganization,
    update as updateOrganization,
} from '@/routes/organizations';
import type {
    OrganizationFilters,
    OrganizationNode,
    OrganizationSummary,
} from '@/types/organization';

type Props = {
    organizations: OrganizationNode[];
    organizationRows: OrganizationNode[];
    parents: Array<Pick<OrganizationNode, 'id' | 'code' | 'name' | 'level'>>;
    summary: OrganizationSummary;
    filters: OrganizationFilters;
};

type OrganizationFormData = {
    parent_id: string;
    code: string;
    name: string;
    level: string;
    node_type: string;
    directorate_group: string;
    is_revenue_center: boolean;
    is_cost_center: boolean;
    is_active: boolean;
    sort_order: string;
};

type OrganizationTableNode = OrganizationNode & {
    children: OrganizationTableNode[];
};

function createDefaultForm(): OrganizationFormData {
    return {
        parent_id: '',
        code: '',
        name: '',
        level: '',
        node_type: '',
        directorate_group: '',
        is_revenue_center: false,
        is_cost_center: true,
        is_active: true,
        sort_order: '0',
    };
}

function toFormData(item: OrganizationNode): OrganizationFormData {
    return {
        parent_id: item.parent_id ? String(item.parent_id) : '',
        code: item.code,
        name: item.name,
        level: item.level ?? '',
        node_type: item.node_type ?? '',
        directorate_group: item.directorate_group ?? '',
        is_revenue_center: item.is_revenue_center,
        is_cost_center: item.is_cost_center,
        is_active: item.is_active,
        sort_order: String(item.sort_order ?? 0),
    };
}

function StatCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number | string;
    icon: ElementType;
}) {
    return (
        <Card className="rounded-lg border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-1 text-2xl font-semibold text-primary">
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

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}

function TextField({
    label,
    value,
    onChange,
    error,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
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

function OrganizationBadges({ node }: { node: OrganizationNode }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                {node.code}
            </Badge>

            {node.level && (
                <Badge
                    variant="outline"
                    className="border-primary/25 bg-primary/5 text-primary"
                >
                    {node.level}
                </Badge>
            )}

            <Badge
                variant="secondary"
                className={
                    node.is_revenue_center
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                }
            >
                {node.is_revenue_center ? 'Revenue Center' : 'Cost Center'}
            </Badge>

            {!node.is_active && (
                <Badge variant="outline" className="text-muted-foreground">
                    Inactive
                </Badge>
            )}
        </div>
    );
}

function buildOrganizationTableTree(rows: OrganizationNode[]) {
    const nodesById = new Map<number, OrganizationTableNode>();

    rows.forEach((row) => {
        nodesById.set(row.id, {
            ...row,
            children: [],
        });
    });

    const roots: OrganizationTableNode[] = [];

    rows.forEach((row) => {
        const node = nodesById.get(row.id);

        if (!node) {
            return;
        }

        if (row.parent_id && nodesById.has(row.parent_id)) {
            nodesById.get(row.parent_id)?.children.push(node);

            return;
        }

        roots.push(node);
    });

    return roots;
}

function OrganizationTableTreeRows({
    nodes,
    depth = 0,
    onDetail,
    onEdit,
    onDelete,
}: {
    nodes: OrganizationTableNode[];
    depth?: number;
    onDetail: (item: OrganizationNode) => void;
    onEdit: (item: OrganizationNode) => void;
    onDelete: (item: OrganizationNode) => void;
}) {
    const [openNodeId, setOpenNodeId] = useState<number | null>(
        depth === 0 && nodes.length > 0 ? nodes[0].id : null,
    );

    return (
        <>
            {nodes.map((node) => {
                const isOpen = openNodeId === node.id;

                return (
                    <OrganizationTableRow
                        key={node.id}
                        node={node}
                        depth={depth}
                        isOpen={isOpen}
                        onOpenChange={(open) =>
                            setOpenNodeId(open ? node.id : null)
                        }
                        onDetail={onDetail}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                );
            })}
        </>
    );
}

function OrganizationTableRow({
    node,
    depth,
    isOpen,
    onOpenChange,
    onDetail,
    onEdit,
    onDelete,
}: {
    node: OrganizationTableNode;
    depth: number;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onDetail: (item: OrganizationNode) => void;
    onEdit: (item: OrganizationNode) => void;
    onDelete: (item: OrganizationNode) => void;
}) {
    const hasChildren = node.children.length > 0;

    return (
        <>
            <TableRow className="align-top">
                <TableCell className="p-4">
                    <div
                        className="flex items-start gap-3"
                        style={{
                            paddingLeft: depth > 0 ? `${depth * 22}px` : 0,
                        }}
                    >
                        <button
                            type="button"
                            disabled={!hasChildren}
                            aria-expanded={hasChildren ? isOpen : undefined}
                            onClick={() => onOpenChange(!isOpen)}
                            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/15 disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground"
                        >
                            {hasChildren ? (
                                isOpen ? (
                                    <ChevronDown className="size-4" />
                                ) : (
                                    <ChevronRight className="size-4" />
                                )
                            ) : (
                                <span className="size-1.5 rounded-full bg-current" />
                            )}
                        </button>

                        <div className="min-w-0 flex-1">
                            <OrganizationBadges node={node} />
                            <p className="mt-2 font-medium text-foreground">
                                {node.name}
                            </p>
                            {node.directorate_group && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {node.directorate_group}
                                </p>
                            )}
                            {hasChildren && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {node.children.length} child
                                </p>
                            )}
                        </div>
                    </div>
                </TableCell>
                <TableCell className="p-4 text-muted-foreground">
                    {node.parent_name ?? 'Root'}
                </TableCell>
                <TableCell className="p-4 text-muted-foreground">
                    {node.node_type ?? '-'}
                </TableCell>
                <TableCell className="p-4 text-right">
                    {node.sort_order}
                </TableCell>
                <TableCell className="p-4">
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onDetail(node)}
                        >
                            <Eye className="size-4" />
                            Detail
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onEdit(node)}
                        >
                            <Pencil className="size-4" />
                            Edit
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(node)}
                            disabled={!node.is_active}
                        >
                            <Trash2 className="size-4" />
                            Hapus
                        </Button>
                    </div>
                </TableCell>
            </TableRow>

            {isOpen && hasChildren && (
                <OrganizationTableTreeRows
                    nodes={node.children}
                    depth={depth + 1}
                    onDetail={onDetail}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            )}
        </>
    );
}

function OrganizationsIndex({
    organizationRows,
    parents,
    summary,
    filters,
}: Props) {
    const [selectedItem, setSelectedItem] = useState<OrganizationNode | null>(
        null,
    );
    const [detailItem, setDetailItem] = useState<OrganizationNode | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterForm, setFilterForm] = useState({
        search: filters.search ?? '',
        status: filters.status ?? 'active',
    });
    const organizationTableTree = useMemo(
        () => buildOrganizationTableTree(organizationRows),
        [organizationRows],
    );

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<OrganizationFormData>(createDefaultForm());

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            organizationsIndex.url(),
            {
                search: filterForm.search,
                status: filterForm.status,
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
        setData(createDefaultForm());
        setIsFormOpen(true);
    };

    const openEditForm = (item: OrganizationNode) => {
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
            put(updateOrganization.url(selectedItem.slug), options);

            return;
        }

        post(storeOrganization.url(), options);
    };

    const destroy = (item: OrganizationNode) => {
        if (!confirm(`Nonaktifkan organisasi ${item.code} - ${item.name}?`)) {
            return;
        }

        router.delete(destroyOrganization.url(item.slug), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Struktur Organisasi APN" />

            <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold text-primary uppercase">
                                Sprint 6B - CRUD Organizations
                            </p>
                            <h1 className="text-2xl font-semibold text-foreground">
                                Struktur Organisasi APN
                            </h1>
                            <p className="max-w-3xl text-muted-foreground">
                                Kelola parent, revenue/cost center, status, dan
                                urutan organisasi untuk pohon EBITDA.
                            </p>
                        </div>

                        <Button type="button" onClick={openCreateForm}>
                            <Plus className="size-4" />
                            Tambah Organisasi
                        </Button>
                    </section>

                    <section className="grid gap-4 md:grid-cols-4">
                        <StatCard
                            title="Total Node"
                            value={summary.total_nodes}
                            icon={Network}
                        />
                        <StatCard
                            title="Active Node"
                            value={summary.active_nodes}
                            icon={Building2}
                        />
                        <StatCard
                            title="Revenue Center"
                            value={summary.revenue_centers}
                            icon={CircleDot}
                        />
                        <StatCard
                            title="Cost Center"
                            value={summary.cost_centers}
                            icon={ShieldCheck}
                        />
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardContent className="p-5">
                            <form
                                onSubmit={submitFilters}
                                className="grid gap-4 md:grid-cols-[1fr_180px_auto]"
                            >
                                <div className="space-y-2">
                                    <Label>Search</Label>
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
                                            placeholder="Cari kode, nama, level, atau group"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <select
                                        value={filterForm.status}
                                        onChange={(event) =>
                                            setFilterForm((current) => ({
                                                ...current,
                                                status: event.target
                                                    .value as OrganizationFilters['status'],
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                        <option value="all">Semua</option>
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
                            <CardTitle>Data Organisasi</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="min-w-[320px] p-4">
                                            Organisasi
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Parent
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Tipe
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            Sort
                                        </TableHead>
                                        <TableHead className="w-[280px] p-4 text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <OrganizationTableTreeRows
                                        key={`${filters.search}-${filters.status}-${organizationRows.length}`}
                                        nodes={organizationTableTree}
                                        onDetail={setDetailItem}
                                        onEdit={openEditForm}
                                        onDelete={destroy}
                                    />

                                    {organizationRows.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Data organisasi tidak ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/*
                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardHeader className="border-b">
                            <CardTitle className="text-foreground">
                                Organization Tree
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <OrganizationTreeList nodes={organizations} />
                        </CardContent>
                    </Card>
                    */}
                </div>
            </main>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <form onSubmit={submit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedItem
                                    ? 'Edit Organisasi'
                                    : 'Tambah Organisasi'}
                            </DialogTitle>
                            <DialogDescription>
                                Atur parent, klasifikasi center, status, dan
                                urutan organisasi.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Parent</Label>
                                <select
                                    value={data.parent_id}
                                    onChange={(event) =>
                                        setData('parent_id', event.target.value)
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                >
                                    <option value="">Root</option>
                                    {parents
                                        .filter(
                                            (parent) =>
                                                parent.id !== selectedItem?.id,
                                        )
                                        .map((parent) => (
                                            <option
                                                key={parent.id}
                                                value={parent.id}
                                            >
                                                {parent.code} - {parent.name}
                                            </option>
                                        ))}
                                </select>
                                <FieldError message={errors.parent_id} />
                            </div>

                            <TextField
                                label="Kode"
                                value={data.code}
                                onChange={(value) => setData('code', value)}
                                error={errors.code}
                            />

                            <TextField
                                label="Nama"
                                value={data.name}
                                onChange={(value) => setData('name', value)}
                                error={errors.name}
                            />

                            <TextField
                                label="Level"
                                value={data.level}
                                onChange={(value) => setData('level', value)}
                                error={errors.level}
                            />

                            <TextField
                                label="Node Type"
                                value={data.node_type}
                                onChange={(value) =>
                                    setData('node_type', value)
                                }
                                error={errors.node_type}
                            />

                            <TextField
                                label="Directorate Group"
                                value={data.directorate_group}
                                onChange={(value) =>
                                    setData('directorate_group', value)
                                }
                                error={errors.directorate_group}
                            />

                            <TextField
                                label="Sort Order"
                                type="number"
                                value={data.sort_order}
                                onChange={(value) =>
                                    setData('sort_order', value)
                                }
                                error={errors.sort_order}
                            />

                            <label className="flex items-center gap-3 rounded-lg border p-4">
                                <Checkbox
                                    checked={data.is_revenue_center}
                                    onCheckedChange={(checked) =>
                                        setData(
                                            'is_revenue_center',
                                            checked === true,
                                        )
                                    }
                                />
                                <span className="text-sm font-medium text-foreground">
                                    Revenue Center
                                </span>
                            </label>

                            <label className="flex items-center gap-3 rounded-lg border p-4">
                                <Checkbox
                                    checked={data.is_cost_center}
                                    onCheckedChange={(checked) =>
                                        setData(
                                            'is_cost_center',
                                            checked === true,
                                        )
                                    }
                                />
                                <span className="text-sm font-medium text-foreground">
                                    Cost Center
                                </span>
                            </label>

                            <label className="flex items-center gap-3 rounded-lg border p-4 md:col-span-2">
                                <Checkbox
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData(
                                            'is_active',
                                            checked === true,
                                        )
                                    }
                                />
                                <span className="text-sm font-medium text-foreground">
                                    Aktif
                                </span>
                            </label>
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
                <DialogContent className="sm:max-w-3xl">
                    {detailItem && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Detail Organisasi</DialogTitle>
                                <DialogDescription>
                                    Informasi lengkap node organisasi.
                                </DialogDescription>
                            </DialogHeader>

                            <section className="space-y-4 rounded-lg border bg-card p-4">
                                <OrganizationBadges node={detailItem} />
                                <h2 className="text-xl font-semibold text-foreground">
                                    {detailItem.name}
                                </h2>
                                <div className="grid gap-3 text-sm md:grid-cols-2">
                                    <p>
                                        <span className="text-muted-foreground">
                                            Parent:{' '}
                                        </span>
                                        {detailItem.parent_name ?? 'Root'}
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Node Type:{' '}
                                        </span>
                                        {detailItem.node_type ?? '-'}
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Path:{' '}
                                        </span>
                                        {detailItem.path ?? '-'}
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Sort Order:{' '}
                                        </span>
                                        {detailItem.sort_order}
                                    </p>
                                </div>
                            </section>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

OrganizationsIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Organisasi',
            href: organizationsIndex(),
        },
    ],
};

export default OrganizationsIndex;
