import { Link } from '@inertiajs/react';
import {
    Background,
    Controls,
    Handle,
    MiniMap,
    Position,
    ReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Edge, Node, NodeProps, NodeTypes } from '@xyflow/react';
import { AlertTriangle, ArrowUpRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    formatCompactCurrency,
    formatCurrency,
    formatPercent,
} from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { show as showDirectorate } from '@/routes/dashboard/directorates';
import type { EbitdaTreeNode } from '@/types/ebitda-tree';

type Props = {
    tree: EbitdaTreeNode | null;
};

type DashboardFlowNode = Node<EbitdaTreeNode, 'dashboardNode'>;

type TreePosition = {
    x: number;
    y: number;
};

const nodeWidth = 280;
const nodeHeight = 164;
const horizontalGap = 64;
const verticalGap = 116;
const overviewColumns = 5;
const overviewHorizontalGap = 44;
const overviewVerticalGap = 72;
const canvasMargin = 40;

function DashboardTreeNode({ data }: NodeProps<DashboardFlowNode>) {
    const isNegative = data.value.ebitda < 0;
    const hasOverrun = data.cost_alert.has_overrun;

    return (
        <div
            className={cn(
                'w-[280px] rounded-lg border-2 bg-card p-3 shadow-sm transition hover:shadow-md',
                hasOverrun
                    ? data.cost_alert.severity === 'danger'
                        ? 'border-black'
                        : 'border-destructive/70'
                    : isNegative
                      ? 'border-destructive/40'
                      : 'border-border',
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!h-3 !w-3 !border-2 !border-card !bg-primary"
            />

            <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground">
                    {data.code}
                </Badge>

                {hasOverrun && (
                    <Badge
                        className={cn(
                            'gap-1 text-white',
                            data.cost_alert.severity === 'danger'
                                ? 'bg-black'
                                : 'bg-destructive',
                        )}
                    >
                        <AlertTriangle className="size-3" />
                        Alert
                    </Badge>
                )}
            </div>

            <h3 className="mt-2 line-clamp-2 min-h-9 text-sm leading-snug font-semibold text-foreground">
                {data.name}
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <MetricPill
                    label="Revenue"
                    value={formatCompactCurrency(data.value.revenue)}
                />
                <MetricPill
                    label="TOC"
                    value={formatCompactCurrency(data.value.toc)}
                />
                <MetricPill
                    label="EBITDA"
                    value={formatCompactCurrency(data.value.ebitda)}
                    danger={isNegative}
                />
                <MetricPill
                    label="Margin"
                    value={formatPercent(data.value.ebitda_margin)}
                />
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!h-3 !w-3 !border-2 !border-card !bg-primary"
            />
        </div>
    );
}

function MetricPill({
    label,
    value,
    danger = false,
}: {
    label: string;
    value: string;
    danger?: boolean;
}) {
    return (
        <div className="rounded-md bg-muted p-2">
            <p className="text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'font-semibold text-foreground',
                    danger && 'text-destructive',
                )}
            >
                {value}
            </p>
        </div>
    );
}

const nodeTypes: NodeTypes = {
    dashboardNode: DashboardTreeNode,
};

function flattenTree(
    node: EbitdaTreeNode,
    nodes: DashboardFlowNode[] = [],
    edges: Edge[] = [],
): { nodes: DashboardFlowNode[]; edges: Edge[] } {
    nodes.push({
        id: String(node.id),
        type: 'dashboardNode',
        position: { x: 0, y: 0 },
        data: node,
    });

    node.children.forEach((child) => {
        edges.push({
            id: `${node.id}-${child.id}`,
            source: String(node.id),
            target: String(child.id),
            type: 'smoothstep',
            style: {
                strokeWidth: 2,
            },
        });

        flattenTree(child, nodes, edges);
    });

    return { nodes, edges };
}

function assignTreePositions(
    node: EbitdaTreeNode,
    depth: number,
    nextLeafIndex: { value: number },
    positions: Map<string, TreePosition>,
): number {
    const childCenters = node.children.map((child) =>
        assignTreePositions(child, depth + 1, nextLeafIndex, positions),
    );

    const centerX =
        childCenters.length > 0
            ? (childCenters[0] + childCenters[childCenters.length - 1]) / 2
            : nextLeafIndex.value++ * (nodeWidth + horizontalGap) +
              nodeWidth / 2;

    positions.set(String(node.id), {
        x: canvasMargin + centerX - nodeWidth / 2,
        y: canvasMargin + depth * (nodeHeight + verticalGap),
    });

    return centerX;
}

function isOverviewTree(tree: EbitdaTreeNode): boolean {
    return (
        tree.children.length > overviewColumns &&
        tree.children.every((child) => child.children.length === 0)
    );
}

function assignOverviewPositions(
    tree: EbitdaTreeNode,
    positions: Map<string, TreePosition>,
) {
    const columns = Math.min(overviewColumns, tree.children.length);
    const gridWidth =
        columns * nodeWidth + (columns - 1) * overviewHorizontalGap;
    const rootX = canvasMargin + gridWidth / 2 - nodeWidth / 2;

    positions.set(String(tree.id), {
        x: rootX,
        y: canvasMargin,
    });

    tree.children.forEach((child, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;

        positions.set(String(child.id), {
            x: canvasMargin + column * (nodeWidth + overviewHorizontalGap),
            y:
                canvasMargin +
                nodeHeight +
                verticalGap +
                row * (nodeHeight + overviewVerticalGap),
        });
    });
}

function getLayoutedElements(tree: EbitdaTreeNode) {
    const flattened = flattenTree(tree);
    const positions = new Map<string, TreePosition>();

    if (isOverviewTree(tree)) {
        assignOverviewPositions(tree, positions);
    } else {
        assignTreePositions(tree, 0, { value: 0 }, positions);
    }

    return {
        nodes: flattened.nodes.map((node) => ({
            ...node,
            position: positions.get(node.id) ?? node.position,
        })),
        edges: flattened.edges,
    };
}

function findTreeNode(node: EbitdaTreeNode, id: string): EbitdaTreeNode | null {
    if (String(node.id) === id) {
        return node;
    }

    for (const child of node.children) {
        const foundNode = findTreeNode(child, id);

        if (foundNode) {
            return foundNode;
        }
    }

    return null;
}

function DashboardTreeCanvas({ tree }: { tree: EbitdaTreeNode }) {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const layouted = useMemo(() => getLayoutedElements(tree), [tree]);
    const selectedNode = useMemo(
        () => (selectedNodeId ? findTreeNode(tree, selectedNodeId) : null),
        [selectedNodeId, tree],
    );

    return (
        <Card className="overflow-hidden border bg-card shadow-sm">
            <CardHeader className="border-b">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-foreground">
                        Dashboard per Unit Organisasi
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Klik node untuk membuka ringkasan dan akses detail.
                    </p>
                </div>
            </CardHeader>

            <CardContent className="relative h-[760px] p-0">
                <ReactFlow
                    nodes={layouted.nodes}
                    edges={layouted.edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    onPaneClick={() => setSelectedNodeId(null)}
                    fitView
                    fitViewOptions={{ padding: 0.18 }}
                    minZoom={0.12}
                    maxZoom={1.6}
                    nodesDraggable={false}
                    className="bg-card text-foreground [&_.react-flow__attribution]:bg-card/80 [&_.react-flow__controls-button]:border-border [&_.react-flow__controls-button]:bg-card [&_.react-flow__controls-button]:text-foreground [&_.react-flow__controls-button:hover]:bg-accent [&_.react-flow__minimap]:border [&_.react-flow__minimap]:border-border [&_.react-flow__minimap]:bg-card"
                >
                    <Background className="text-border" />
                    <Controls />
                    <MiniMap
                        pannable
                        zoomable
                        nodeStrokeWidth={3}
                        nodeColor={(node) =>
                            (node.data as EbitdaTreeNode).cost_alert
                                ?.has_overrun
                                ? '#dc2626'
                                : '#94a3b8'
                        }
                    />
                </ReactFlow>

                {selectedNode && (
                    <NodeTooltip
                        node={selectedNode}
                        onClose={() => setSelectedNodeId(null)}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function NodeTooltip({
    node,
    onClose,
}: {
    node: EbitdaTreeNode;
    onClose: () => void;
}) {
    return (
        <div className="absolute top-4 right-4 z-20 w-[340px] rounded-lg border bg-popover p-4 text-popover-foreground shadow-xl">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                        <Badge className="bg-primary text-primary-foreground">
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
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-foreground">
                        {node.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {node.is_revenue_center
                            ? 'Revenue Center'
                            : 'Cost Center'}
                    </p>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={onClose}
                >
                    <X className="size-4" />
                    <span className="sr-only">Tutup ringkasan</span>
                </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <TooltipMetric
                    label="Revenue"
                    value={formatCurrency(node.value.revenue)}
                />
                <TooltipMetric
                    label="TOC"
                    value={formatCurrency(node.value.toc)}
                />
                <TooltipMetric
                    label="EBITDA"
                    value={formatCurrency(node.value.ebitda)}
                    danger={node.value.ebitda < 0}
                />
                <TooltipMetric
                    label="Margin"
                    value={formatPercent(node.value.ebitda_margin)}
                />
            </div>

            {node.cost_alert.has_overrun && (
                <div
                    className={cn(
                        'mt-4 rounded-lg border p-3 text-sm',
                        node.cost_alert.severity === 'danger'
                            ? 'border-black bg-black text-white'
                            : 'border-destructive/30 bg-destructive/10 text-destructive',
                    )}
                >
                    <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="size-4" />
                        Area pemborosan
                    </div>
                    <p className="mt-1 text-xs opacity-80">
                        {node.cost_alert.message}
                    </p>
                </div>
            )}

            <Button asChild className="mt-4 w-full">
                <Link href={showDirectorate(node.slug)}>
                    Detail
                    <ArrowUpRight className="size-4" />
                </Link>
            </Button>
        </div>
    );
}

function TooltipMetric({
    label,
    value,
    danger = false,
}: {
    label: string;
    value: string;
    danger?: boolean;
}) {
    return (
        <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'mt-1 text-sm font-semibold text-foreground',
                    danger && 'text-destructive',
                )}
            >
                {value}
            </p>
        </div>
    );
}

export default function DashboardOrganizationTree({ tree }: Props) {
    if (!tree) {
        return (
            <Card className="border bg-card shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                    Data struktur organisasi belum tersedia.
                </CardContent>
            </Card>
        );
    }

    return (
        <ReactFlowProvider>
            <DashboardTreeCanvas tree={tree} />
        </ReactFlowProvider>
    );
}
