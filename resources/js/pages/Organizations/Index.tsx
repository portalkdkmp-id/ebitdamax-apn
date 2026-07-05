import { Head } from '@inertiajs/react';
import {
    Building2,
    ChevronDown,
    ChevronRight,
    CircleDot,
    Network,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import type { ElementType } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { index as organizationsIndex } from '@/routes/organizations';
import type {
    OrganizationNode,
    OrganizationSummary,
} from '@/types/organization';

type Props = {
    organizations: OrganizationNode[];
    summary: OrganizationSummary;
};

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

function OrganizationTreeList({
    nodes,
    depth = 0,
}: {
    nodes?: OrganizationNode[];
    depth?: number;
}) {
    const safeNodes = nodes ?? [];
    const [openNodeId, setOpenNodeId] = useState<number | null>(
        depth === 0 && safeNodes.length > 0 ? safeNodes[0].id : null,
    );

    return (
        <div className={depth === 0 ? 'space-y-3' : 'space-y-2'}>
            {safeNodes.map((node) => (
                <OrganizationTreeItem
                    key={node.id}
                    node={node}
                    depth={depth}
                    isOpen={openNodeId === node.id}
                    onOpenChange={(isOpen) =>
                        setOpenNodeId(isOpen ? node.id : null)
                    }
                />
            ))}
        </div>
    );
}

function OrganizationTreeItem({
    node,
    depth,
    isOpen,
    onOpenChange,
}: {
    node: OrganizationNode;
    depth: number;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    const children = node.children ?? [];
    const hasChildren = children.length > 0;

    return (
        <Collapsible open={isOpen} onOpenChange={onOpenChange}>
            <div
                className="relative"
                style={{ paddingLeft: depth > 0 ? `${depth * 18}px` : 0 }}
            >
                {depth > 0 && (
                    <div className="absolute top-0 bottom-0 left-0 border-l border-border" />
                )}

                <CollapsibleTrigger asChild disabled={!hasChildren}>
                    <button
                        type="button"
                        className="group flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md disabled:cursor-default disabled:hover:border-border disabled:hover:bg-card disabled:hover:shadow-sm"
                    >
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            {hasChildren ? (
                                isOpen ? (
                                    <ChevronDown className="size-4" />
                                ) : (
                                    <ChevronRight className="size-4" />
                                )
                            ) : (
                                <span className="size-1.5 rounded-full bg-primary" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
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
                                    {node.is_revenue_center
                                        ? 'Revenue Center'
                                        : 'Cost Center'}
                                </Badge>

                                {hasChildren && (
                                    <Badge
                                        variant="outline"
                                        className="border-border text-muted-foreground"
                                    >
                                        {children.length} child
                                    </Badge>
                                )}
                            </div>

                            <h3 className="text-base leading-snug font-semibold text-foreground">
                                {node.name}
                            </h3>

                            {node.directorate_group && (
                                <p className="text-sm text-muted-foreground">
                                    Group: {node.directorate_group}
                                </p>
                            )}
                        </div>

                        <div className="hidden text-right text-xs text-muted-foreground sm:block">
                            Depth {node.depth}
                        </div>
                    </button>
                </CollapsibleTrigger>

                {hasChildren && (
                    <CollapsibleContent className="mt-2 pl-5">
                        <OrganizationTreeList
                            nodes={children}
                            depth={depth + 1}
                        />
                    </CollapsibleContent>
                )}
            </div>
        </Collapsible>
    );
}

function OrganizationsIndex({ organizations, summary }: Props) {
    return (
        <>
            <Head title="Struktur Organisasi APN" />

            <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold text-primary uppercase">
                                Sprint 2 - Master Data Organization
                            </p>
                            <h1 className="text-2xl font-semibold text-foreground">
                                Struktur Organisasi APN
                            </h1>
                            <p className="max-w-3xl text-muted-foreground">
                                Struktur organisasi ini menjadi master data
                                utama untuk membangun Dashboard Pohon EBITDA,
                                mapping revenue center, cost center, dan
                                agregasi EBITDA dari sub-unit ke level Direksi.
                            </p>
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-4">
                        <StatCard
                            title="Total Node"
                            value={summary.total_nodes}
                            icon={Network}
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
                        <StatCard
                            title="Max Depth"
                            value={summary.max_depth}
                            icon={Building2}
                        />
                    </section>

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
                </div>
            </main>
        </>
    );
}

OrganizationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Organisasi',
            href: organizationsIndex(),
        },
    ],
};

export default OrganizationsIndex;
