import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CostOverrunAlert } from '@/types/dashboard';

type Props = {
    data: CostOverrunAlert[];
};

function isComponentOverrun(item: CostOverrunAlert, key: string) {
    return item.overrun_components.some((component) => component.key === key);
}

function CostCell({
    item,
    field,
}: {
    item: CostOverrunAlert;
    field: 'doc_variable' | 'doc_fixed' | 'ioc';
}) {
    const isOverrun = isComponentOverrun(item, field);

    return (
        <td
            className={cn(
                'p-3 text-right',
                isOverrun && 'font-bold text-destructive',
            )}
        >
            {formatCurrency(item[field])}
        </td>
    );
}

export default function NegativeEbitdaAlertTable({ data }: Props) {
    return (
        <Card className="border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Alert Area Pemborosan Cost
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                                <th className="p-3">Unit</th>
                                <th className="p-3 text-right">TOC Parent</th>
                                <th className="p-3 text-right">DOC-V</th>
                                <th className="p-3 text-right">DOC-F</th>
                                <th className="p-3 text-right">IOC</th>
                                <th className="p-3">Area</th>
                                <th className="p-3 text-right">Selisih</th>
                                <th className="p-3">Analisis Awal</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.map((item) => (
                                <tr
                                    key={`${item.organization_id}-${item.code}`}
                                    className="border-b transition-colors hover:bg-muted/40"
                                >
                                    <td className="p-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge className="bg-primary text-primary-foreground">
                                                {item.code ?? '-'}
                                            </Badge>
                                            {item.level && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-primary/25 bg-primary/5 text-primary"
                                                >
                                                    {item.level}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-1 font-medium text-foreground">
                                            {item.name ?? '-'}
                                        </div>
                                    </td>

                                    <td className="p-3 text-right">
                                        {formatCurrency(item.benchmark_toc)}
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {item.benchmark_label}
                                        </div>
                                    </td>

                                    <CostCell
                                        item={item}
                                        field="doc_variable"
                                    />
                                    <CostCell item={item} field="doc_fixed" />
                                    <CostCell item={item} field="ioc" />

                                    <td className="p-3">
                                        <Badge
                                            className={cn(
                                                'text-white',
                                                item.severity === 'danger'
                                                    ? 'bg-black hover:bg-black/90'
                                                    : 'bg-destructive hover:bg-destructive/90',
                                            )}
                                        >
                                            {item.largest_component_label ??
                                                'Cost'}
                                        </Badge>
                                        {item.overrun_ratio !== null && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {item.overrun_ratio.toFixed(2)}%
                                                dari TOC
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-3 text-right font-bold text-destructive">
                                        {formatCurrency(item.overrun_amount)}
                                    </td>

                                    <td className="p-3 text-sm text-muted-foreground">
                                        {item.analysis}
                                    </td>
                                </tr>
                            ))}

                            {data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="p-8 text-center text-muted-foreground"
                                    >
                                        Tidak ada indikasi area pemborosan cost
                                        pada scenario ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
