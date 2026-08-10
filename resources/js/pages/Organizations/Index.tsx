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
import { cn } from '@/lib/utils';
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

type OrganizationTone = {
    row: string;
    openRow: string;
    border: string;
    codeBadge: string;
    softBadge: string;
    centerBadge: string;
    toggle: string;
    text: string;
    panel: string;
};

const organizationTones: Record<string, OrganizationTone> = {
    default: {
        row: 'bg-background hover:bg-muted/50',
        openRow: 'bg-muted/30',
        border: 'border-l-muted',
        codeBadge: 'bg-primary text-primary-foreground hover:bg-primary/90',
        softBadge: 'border-primary/25 bg-primary/5 text-primary',
        centerBadge: 'bg-primary/10 text-primary',
        toggle: 'bg-primary/10 text-primary hover:bg-primary/15',
        text: 'text-foreground',
        panel: 'border-border bg-card',
    },
    '1': {
        row: 'bg-red-50/40 hover:bg-red-50',
        openRow: 'bg-red-50',
        border: 'border-l-red-600',
        codeBadge: 'bg-red-600 text-white hover:bg-red-700',
        softBadge: 'border-red-200 bg-red-50 text-red-700',
        centerBadge: 'bg-red-100 text-red-700',
        toggle: 'bg-red-100 text-red-700 hover:bg-red-200',
        text: 'text-red-900',
        panel: 'border-red-200 bg-red-50/50',
    },
    '1.A': {
        row: 'bg-slate-50/70 hover:bg-slate-100',
        openRow: 'bg-slate-100',
        border: 'border-l-slate-500',
        codeBadge: 'bg-slate-700 text-white hover:bg-slate-800',
        softBadge: 'border-slate-200 bg-slate-50 text-slate-700',
        centerBadge: 'bg-slate-100 text-slate-700',
        toggle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        text: 'text-slate-950',
        panel: 'border-slate-200 bg-slate-50/70',
    },
    '1.A.1': {
        row: 'bg-rose-50/65 hover:bg-rose-100/80',
        openRow: 'bg-rose-100/70',
        border: 'border-l-rose-500',
        codeBadge: 'bg-rose-600 text-white hover:bg-rose-700',
        softBadge: 'border-rose-200 bg-rose-50 text-rose-700',
        centerBadge: 'bg-rose-100 text-rose-700',
        toggle: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
        text: 'text-rose-950',
        panel: 'border-rose-200 bg-rose-50/60',
    },
    '1.A.2': {
        row: 'bg-amber-50/70 hover:bg-amber-100/80',
        openRow: 'bg-amber-100/70',
        border: 'border-l-amber-500',
        codeBadge: 'bg-amber-600 text-white hover:bg-amber-700',
        softBadge: 'border-amber-200 bg-amber-50 text-amber-800',
        centerBadge: 'bg-amber-100 text-amber-800',
        toggle: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
        text: 'text-amber-950',
        panel: 'border-amber-200 bg-amber-50/60',
    },
    '1.A.3': {
        row: 'bg-orange-50/70 hover:bg-orange-100/80',
        openRow: 'bg-orange-100/70',
        border: 'border-l-orange-500',
        codeBadge: 'bg-orange-600 text-white hover:bg-orange-700',
        softBadge: 'border-orange-200 bg-orange-50 text-orange-800',
        centerBadge: 'bg-orange-100 text-orange-800',
        toggle: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
        text: 'text-orange-950',
        panel: 'border-orange-200 bg-orange-50/60',
    },
    '1.A.4': {
        row: 'bg-lime-50/70 hover:bg-lime-100/80',
        openRow: 'bg-lime-100/70',
        border: 'border-l-lime-600',
        codeBadge: 'bg-lime-700 text-white hover:bg-lime-800',
        softBadge: 'border-lime-200 bg-lime-50 text-lime-800',
        centerBadge: 'bg-lime-100 text-lime-800',
        toggle: 'bg-lime-100 text-lime-800 hover:bg-lime-200',
        text: 'text-lime-950',
        panel: 'border-lime-200 bg-lime-50/60',
    },
    '1.A.5': {
        row: 'bg-emerald-50/70 hover:bg-emerald-100/80',
        openRow: 'bg-emerald-100/70',
        border: 'border-l-emerald-600',
        codeBadge: 'bg-emerald-700 text-white hover:bg-emerald-800',
        softBadge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        centerBadge: 'bg-emerald-100 text-emerald-800',
        toggle: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
        text: 'text-emerald-950',
        panel: 'border-emerald-200 bg-emerald-50/60',
    },
    '1.A.6': {
        row: 'bg-teal-50/70 hover:bg-teal-100/80',
        openRow: 'bg-teal-100/70',
        border: 'border-l-teal-600',
        codeBadge: 'bg-teal-700 text-white hover:bg-teal-800',
        softBadge: 'border-teal-200 bg-teal-50 text-teal-800',
        centerBadge: 'bg-teal-100 text-teal-800',
        toggle: 'bg-teal-100 text-teal-800 hover:bg-teal-200',
        text: 'text-teal-950',
        panel: 'border-teal-200 bg-teal-50/60',
    },
    '1.A.7': {
        row: 'bg-sky-50/70 hover:bg-sky-100/80',
        openRow: 'bg-sky-100/70',
        border: 'border-l-sky-600',
        codeBadge: 'bg-sky-700 text-white hover:bg-sky-800',
        softBadge: 'border-sky-200 bg-sky-50 text-sky-800',
        centerBadge: 'bg-sky-100 text-sky-800',
        toggle: 'bg-sky-100 text-sky-800 hover:bg-sky-200',
        text: 'text-sky-950',
        panel: 'border-sky-200 bg-sky-50/60',
    },
    '1.A.8': {
        row: 'bg-blue-50/70 hover:bg-blue-100/80',
        openRow: 'bg-blue-100/70',
        border: 'border-l-blue-600',
        codeBadge: 'bg-blue-700 text-white hover:bg-blue-800',
        softBadge: 'border-blue-200 bg-blue-50 text-blue-800',
        centerBadge: 'bg-blue-100 text-blue-800',
        toggle: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        text: 'text-blue-950',
        panel: 'border-blue-200 bg-blue-50/60',
    },
    '1.B.1': {
        row: 'bg-violet-50/70 hover:bg-violet-100/80',
        openRow: 'bg-violet-100/70',
        border: 'border-l-violet-600',
        codeBadge: 'bg-violet-700 text-white hover:bg-violet-800',
        softBadge: 'border-violet-200 bg-violet-50 text-violet-800',
        centerBadge: 'bg-violet-100 text-violet-800',
        toggle: 'bg-violet-100 text-violet-800 hover:bg-violet-200',
        text: 'text-violet-950',
        panel: 'border-violet-200 bg-violet-50/60',
    },
    '1.B.2': {
        row: 'bg-fuchsia-50/70 hover:bg-fuchsia-100/80',
        openRow: 'bg-fuchsia-100/70',
        border: 'border-l-fuchsia-600',
        codeBadge: 'bg-fuchsia-700 text-white hover:bg-fuchsia-800',
        softBadge: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800',
        centerBadge: 'bg-fuchsia-100 text-fuchsia-800',
        toggle: 'bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200',
        text: 'text-fuchsia-950',
        panel: 'border-fuchsia-200 bg-fuchsia-50/60',
    },
    '1.B.3': {
        row: 'bg-pink-50/70 hover:bg-pink-100/80',
        openRow: 'bg-pink-100/70',
        border: 'border-l-pink-600',
        codeBadge: 'bg-pink-700 text-white hover:bg-pink-800',
        softBadge: 'border-pink-200 bg-pink-50 text-pink-800',
        centerBadge: 'bg-pink-100 text-pink-800',
        toggle: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
        text: 'text-pink-950',
        panel: 'border-pink-200 bg-pink-50/60',
    },
    '1.B.4': {
        row: 'bg-red-50/65 hover:bg-red-100/80',
        openRow: 'bg-red-100/70',
        border: 'border-l-red-500',
        codeBadge: 'bg-red-600 text-white hover:bg-red-700',
        softBadge: 'border-red-200 bg-red-50 text-red-700',
        centerBadge: 'bg-red-100 text-red-700',
        toggle: 'bg-red-100 text-red-700 hover:bg-red-200',
        text: 'text-red-950',
        panel: 'border-red-200 bg-red-50/60',
    },
    '1.B.5': {
        row: 'bg-cyan-50/70 hover:bg-cyan-100/80',
        openRow: 'bg-cyan-100/70',
        border: 'border-l-cyan-600',
        codeBadge: 'bg-cyan-700 text-white hover:bg-cyan-800',
        softBadge: 'border-cyan-200 bg-cyan-50 text-cyan-800',
        centerBadge: 'bg-cyan-100 text-cyan-800',
        toggle: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
        text: 'text-cyan-950',
        panel: 'border-cyan-200 bg-cyan-50/60',
    },
    '1.C.1': {
        row: 'bg-indigo-50/70 hover:bg-indigo-100/80',
        openRow: 'bg-indigo-100/70',
        border: 'border-l-indigo-600',
        codeBadge: 'bg-indigo-700 text-white hover:bg-indigo-800',
        softBadge: 'border-indigo-200 bg-indigo-50 text-indigo-800',
        centerBadge: 'bg-indigo-100 text-indigo-800',
        toggle: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
        text: 'text-indigo-950',
        panel: 'border-indigo-200 bg-indigo-50/60',
    },
    '1.C.2': {
        row: 'bg-green-50/70 hover:bg-green-100/80',
        openRow: 'bg-green-100/70',
        border: 'border-l-green-600',
        codeBadge: 'bg-green-700 text-white hover:bg-green-800',
        softBadge: 'border-green-200 bg-green-50 text-green-800',
        centerBadge: 'bg-green-100 text-green-800',
        toggle: 'bg-green-100 text-green-800 hover:bg-green-200',
        text: 'text-green-950',
        panel: 'border-green-200 bg-green-50/60',
    },
    '1.C.3': {
        row: 'bg-purple-50/70 hover:bg-purple-100/80',
        openRow: 'bg-purple-100/70',
        border: 'border-l-purple-600',
        codeBadge: 'bg-purple-700 text-white hover:bg-purple-800',
        softBadge: 'border-purple-200 bg-purple-50 text-purple-800',
        centerBadge: 'bg-purple-100 text-purple-800',
        toggle: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
        text: 'text-purple-950',
        panel: 'border-purple-200 bg-purple-50/60',
    },
    '1.C.4': {
        row: 'bg-yellow-50/70 hover:bg-yellow-100/80',
        openRow: 'bg-yellow-100/70',
        border: 'border-l-yellow-500',
        codeBadge: 'bg-yellow-600 text-white hover:bg-yellow-700',
        softBadge: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        centerBadge: 'bg-yellow-100 text-yellow-800',
        toggle: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        text: 'text-yellow-950',
        panel: 'border-yellow-200 bg-yellow-50/60',
    },
    '1.C.5': {
        row: 'bg-stone-50/80 hover:bg-stone-100',
        openRow: 'bg-stone-100',
        border: 'border-l-stone-500',
        codeBadge: 'bg-stone-700 text-white hover:bg-stone-800',
        softBadge: 'border-stone-200 bg-stone-50 text-stone-800',
        centerBadge: 'bg-stone-100 text-stone-800',
        toggle: 'bg-stone-100 text-stone-800 hover:bg-stone-200',
        text: 'text-stone-950',
        panel: 'border-stone-200 bg-stone-50/70',
    },
    '1.C.6': {
        row: 'bg-emerald-50/70 hover:bg-emerald-100/80',
        openRow: 'bg-emerald-100/70',
        border: 'border-l-emerald-600',
        codeBadge: 'bg-emerald-700 text-white hover:bg-emerald-800',
        softBadge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        centerBadge: 'bg-emerald-100 text-emerald-800',
        toggle: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
        text: 'text-emerald-950',
        panel: 'border-emerald-200 bg-emerald-50/60',
    },
};

const organizationToneKeys = [
    '1.A.1',
    '1.A.2',
    '1.A.3',
    '1.A.4',
    '1.A.5',
    '1.A.6',
    '1.A.7',
    '1.A.8',
    '1.B.1',
    '1.B.2',
    '1.B.3',
    '1.B.4',
    '1.B.5',
    '1.C.1',
    '1.C.2',
    '1.C.3',
    '1.C.4',
    '1.C.5',
    '1.C.6',
    '1.A',
    '1',
];

function getOrganizationTone(code: string): OrganizationTone {
    const key = organizationToneKeys.find(
        (toneKey) => code === toneKey || code.startsWith(`${toneKey}.`),
    );

    return organizationTones[key ?? 'default'] ?? organizationTones.default;
}

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
    const tone = getOrganizationTone(node.code);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge className={tone.codeBadge}>{node.code}</Badge>

            {node.level && (
                <Badge variant="outline" className={tone.softBadge}>
                    {node.level}
                </Badge>
            )}

            <Badge
                variant="secondary"
                className={
                    node.is_revenue_center ? tone.codeBadge : tone.centerBadge
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
    const tone = getOrganizationTone(node.code);

    return (
        <>
            <TableRow
                className={cn('align-top', tone.row, isOpen && tone.openRow)}
            >
                <TableCell className={cn('border-l-4 p-4', tone.border)}>
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
                            className={cn(
                                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md transition disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground',
                                tone.toggle,
                            )}
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
                            <p className={cn('mt-2 font-medium', tone.text)}>
                                {node.name}
                            </p>
                            {node.directorate_group && (
                                <p className={cn('mt-1 text-xs', tone.text)}>
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
                            variant={node.is_active ? 'outline' : 'destructive'}
                            size="sm"
                            onClick={() => onDelete(node)}
                        >
                            <Trash2 className="size-4" />
                            {node.is_active ? 'Nonaktifkan' : 'Hapus Permanen'}
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
    const [deleteTarget, setDeleteTarget] = useState<OrganizationNode | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);
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

    const confirmDestroy = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(destroyOrganization.url(deleteTarget.slug), {
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setIsDeleting(false),
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
                                CRUD Organizations
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
                                        onDelete={setDeleteTarget}
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
                                        setData('is_active', checked === true)
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
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <DialogContent
                    showCloseButton={!isDeleting}
                    className="sm:max-w-md"
                >
                    {deleteTarget && (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {deleteTarget.is_active
                                        ? 'Nonaktifkan Organisasi?'
                                        : 'Hapus Organisasi Permanen?'}
                                </DialogTitle>
                                <DialogDescription>
                                    {deleteTarget.is_active ? (
                                        <>
                                            Organisasi{' '}
                                            <span className="font-medium text-foreground">
                                                {deleteTarget.code} -{' '}
                                                {deleteTarget.name}
                                            </span>{' '}
                                            akan dinonaktifkan dan tidak lagi
                                            digunakan pada struktur organisasi.
                                        </>
                                    ) : (
                                        <>
                                            Organisasi{' '}
                                            <span className="font-medium text-foreground">
                                                {deleteTarget.code} -{' '}
                                                {deleteTarget.name}
                                            </span>{' '}
                                            beserta nilai EBITDA, profil, dan
                                            kalkulasi terkait akan dihapus
                                            permanen. Tindakan ini tidak dapat
                                            dibatalkan.
                                        </>
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isDeleting}
                                    onClick={() => setDeleteTarget(null)}
                                >
                                    Tidak
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        deleteTarget.is_active
                                            ? 'default'
                                            : 'destructive'
                                    }
                                    disabled={isDeleting}
                                    onClick={confirmDestroy}
                                >
                                    {isDeleting
                                        ? 'Memproses...'
                                        : deleteTarget.is_active
                                          ? 'Ya, Nonaktifkan'
                                          : 'Ya, Hapus Permanen'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
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

                            <section
                                className={cn(
                                    'space-y-4 rounded-lg border p-4',
                                    getOrganizationTone(detailItem.code).panel,
                                )}
                            >
                                <OrganizationBadges node={detailItem} />
                                <h2
                                    className={cn(
                                        'text-xl font-semibold',
                                        getOrganizationTone(detailItem.code)
                                            .text,
                                    )}
                                >
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
