import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Edge, NodeTypes } from '@xyflow/react';
import { AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EbitdaNodeCard from '@/components/ebitda-tree/EbitdaNodeCard';
import type { EbitdaFlowNode } from '@/components/ebitda-tree/EbitdaNodeCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { EbitdaTreeNode } from '@/types/ebitda-tree';

type Props = {
    tree: EbitdaTreeNode;
};

const nodeWidth = 360;
const nodeHeight = 300;
const horizontalGap = 96;
const verticalGap = 160;
const canvasMargin = 40;

const nodeTypes: NodeTypes = {
    ebitdaNode: EbitdaNodeCard,
};

type FullscreenContainer = HTMLDivElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitFullscreenElement?: Element | null;
};

type TreePosition = {
    x: number;
    y: number;
};

function flattenTree(
    node: EbitdaTreeNode,
    nodes: EbitdaFlowNode[] = [],
    edges: Edge[] = [],
): { nodes: EbitdaFlowNode[]; edges: Edge[] } {
    nodes.push({
        id: String(node.id),
        type: 'ebitdaNode',
        position: { x: 0, y: 0 },
        data: node,
    });

    node.children.forEach((child) => {
        edges.push({
            id: `${node.id}-${child.id}`,
            source: String(node.id),
            target: String(child.id),
            type: 'smoothstep',
            animated: false,
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

function getLayoutedElements(tree: EbitdaTreeNode) {
    const flattened = flattenTree(tree);
    const positions = new Map<string, TreePosition>();

    assignTreePositions(tree, 0, { value: 0 }, positions);

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

function TreeCanvas({ tree }: Props) {
    const containerRef = useRef<FullscreenContainer | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState(() => String(tree.id));
    const { fitView } = useReactFlow<EbitdaFlowNode, Edge>();

    const layouted = useMemo(() => {
        return getLayoutedElements(tree);
    }, [tree]);

    const flowKey = `${tree.id}-${layouted.nodes.length}-${layouted.edges.length}`;
    const selectedNode = useMemo(
        () => findTreeNode(tree, selectedNodeId) ?? tree,
        [selectedNodeId, tree],
    );
    const selectedOverrunKeys = useMemo(
        () =>
            new Set(
                selectedNode.cost_alert.components.map(
                    (component) => component.key,
                ),
            ),
        [selectedNode],
    );

    const refitTree = useCallback(() => {
        window.setTimeout(() => {
            fitView({
                duration: 300,
                padding: 0.2,
            });
        }, 120);
    }, [fitView]);

    const getFullscreenElement = useCallback(() => {
        const fullscreenDocument = document as FullscreenDocument;

        return (
            document.fullscreenElement ??
            fullscreenDocument.webkitFullscreenElement ??
            null
        );
    }, []);

    const toggleFullscreen = useCallback(async () => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const fullscreenDocument = document as FullscreenDocument;
        const fullscreenElement = getFullscreenElement();

        try {
            if (fullscreenElement === container) {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else {
                    await fullscreenDocument.webkitExitFullscreen?.();
                }
            } else if (container.requestFullscreen) {
                await container.requestFullscreen();
            } else {
                await container.webkitRequestFullscreen?.();
            }

            refitTree();
        } catch {
            setIsFullscreen(false);
        }
    }, [getFullscreenElement, refitTree]);

    useEffect(() => {
        const syncFullscreenState = () => {
            setIsFullscreen(getFullscreenElement() === containerRef.current);
            refitTree();
        };

        document.addEventListener('fullscreenchange', syncFullscreenState);
        document.addEventListener(
            'webkitfullscreenchange',
            syncFullscreenState,
        );

        return () => {
            document.removeEventListener(
                'fullscreenchange',
                syncFullscreenState,
            );
            document.removeEventListener(
                'webkitfullscreenchange',
                syncFullscreenState,
            );
        };
    }, [getFullscreenElement, refitTree]);

    return (
        <div
            ref={containerRef}
            className="group/ebitda-tree grid gap-4 bg-background data-[fullscreen=true]:h-screen data-[fullscreen=true]:grid-cols-1 data-[fullscreen=true]:overflow-hidden data-[fullscreen=true]:p-4 xl:grid-cols-[1fr_420px] xl:data-[fullscreen=true]:grid-cols-[1fr_420px]"
            data-fullscreen={isFullscreen}
        >
            <Card className="relative h-[760px] overflow-hidden border bg-card shadow-sm group-data-[fullscreen=true]/ebitda-tree:h-full">
                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 z-20 border bg-card/95 shadow-sm hover:bg-accent"
                    onClick={toggleFullscreen}
                    title={
                        isFullscreen
                            ? 'Keluar dari fullscreen'
                            : 'Buka fullscreen'
                    }
                >
                    {isFullscreen ? (
                        <Minimize2 className="size-4" />
                    ) : (
                        <Maximize2 className="size-4" />
                    )}
                    <span className="sr-only">
                        {isFullscreen
                            ? 'Keluar dari fullscreen'
                            : 'Buka fullscreen'}
                    </span>
                </Button>

                <CardContent className="h-full p-0">
                    <ReactFlow
                        key={flowKey}
                        nodes={layouted.nodes}
                        edges={layouted.edges}
                        nodeTypes={nodeTypes}
                        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        minZoom={0.15}
                        maxZoom={1.5}
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
                </CardContent>
            </Card>

            <Card className="border bg-card shadow-sm">
                <CardContent className="space-y-5 p-5">
                    {selectedNode ? (
                        <>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-primary text-primary-foreground">
                                        {selectedNode.code}
                                    </Badge>

                                    {selectedNode.level && (
                                        <Badge
                                            variant="outline"
                                            className="border-primary/25 bg-primary/5 text-primary"
                                        >
                                            {selectedNode.level}
                                        </Badge>
                                    )}

                                    {selectedNode.cost_alert.has_overrun && (
                                        <Badge
                                            className={cn(
                                                'gap-1 text-white',
                                                selectedNode.cost_alert
                                                    .severity === 'danger'
                                                    ? 'bg-black hover:bg-black/90'
                                                    : 'bg-destructive hover:bg-destructive/90',
                                            )}
                                        >
                                            <AlertTriangle className="size-3" />
                                            Area pemborosan
                                        </Badge>
                                    )}
                                </div>

                                <h2 className="text-lg font-bold text-foreground">
                                    {selectedNode.name}
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    {selectedNode.is_revenue_center
                                        ? 'Revenue Center'
                                        : 'Cost Center'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <DetailRow
                                    label="Revenue"
                                    value={formatCurrency(
                                        selectedNode.value.revenue,
                                    )}
                                />
                                <DetailRow
                                    label="DOC Variable"
                                    value={formatCurrency(
                                        selectedNode.value.doc_variable,
                                    )}
                                    danger={selectedOverrunKeys.has(
                                        'doc_variable',
                                    )}
                                />
                                <DetailRow
                                    label="DOC Fixed"
                                    value={formatCurrency(
                                        selectedNode.value.doc_fixed,
                                    )}
                                    danger={selectedOverrunKeys.has(
                                        'doc_fixed',
                                    )}
                                />
                                <DetailRow
                                    label="IOC"
                                    value={formatCurrency(
                                        selectedNode.value.ioc,
                                    )}
                                    danger={selectedOverrunKeys.has('ioc')}
                                />
                                <DetailRow
                                    label="TOC"
                                    value={formatCurrency(
                                        selectedNode.value.toc,
                                    )}
                                />
                                <DetailRow
                                    label="EBITDA"
                                    value={formatCurrency(
                                        selectedNode.value.ebitda,
                                    )}
                                    danger={selectedNode.value.ebitda < 0}
                                    success={selectedNode.value.ebitda >= 0}
                                />
                                <DetailRow
                                    label="EBITDA Margin"
                                    value={formatPercent(
                                        selectedNode.value.ebitda_margin,
                                    )}
                                />
                            </div>

                            {selectedNode.cost_alert.has_overrun && (
                                <div
                                    className={cn(
                                        'rounded-xl border p-4 text-sm',
                                        selectedNode.cost_alert.severity ===
                                            'danger'
                                            ? 'border-black bg-black text-white'
                                            : 'border-destructive/30 bg-destructive/10 text-destructive',
                                    )}
                                >
                                    <div className="flex items-center gap-2 font-semibold">
                                        <AlertTriangle className="size-4" />
                                        Indikasi area pemborosan
                                    </div>
                                    <p className="mt-2">
                                        {selectedNode.cost_alert.message}
                                    </p>
                                    <p className="mt-2 text-xs opacity-80">
                                        Patokan:{' '}
                                        {
                                            selectedNode.cost_alert
                                                .benchmark_label
                                        }{' '}
                                        ={' '}
                                        {formatCurrency(
                                            selectedNode.cost_alert
                                                .benchmark_toc,
                                        )}
                                    </p>
                                    <div className="mt-3 space-y-2">
                                        {selectedNode.cost_alert.components.map(
                                            (component) => (
                                                <div
                                                    key={component.key}
                                                    className="flex items-center justify-between gap-3 rounded-lg bg-white/10 px-3 py-2"
                                                >
                                                    <span>
                                                        {component.label}
                                                    </span>
                                                    <span className="text-right font-bold">
                                                        {formatCurrency(
                                                            component.overrun_amount,
                                                        )}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
                                <p className="font-semibold">Sumber nilai</p>
                                <p className="mt-1">
                                    {selectedNode.value_source === 'excel'
                                        ? 'Nilai ini berasal langsung dari hasil import Excel.'
                                        : selectedNode.value_source ===
                                            'calculated_from_children'
                                          ? 'Nilai parent ini dihitung dari agregasi child node.'
                                          : 'Node ini belum memiliki nilai dari Excel.'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Klik salah satu node untuk melihat detail.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function DetailRow({
    label,
    value,
    danger = false,
    success = false,
}: {
    label: string;
    value: string;
    danger?: boolean;
    success?: boolean;
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-background p-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
                className={`text-right text-sm font-bold ${
                    danger
                        ? 'text-destructive'
                        : success
                          ? 'text-primary'
                          : 'text-foreground'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

export default function EbitdaTreeFlow({ tree }: Props) {
    return (
        <ReactFlowProvider>
            <TreeCanvas tree={tree} />
        </ReactFlowProvider>
    );
}
