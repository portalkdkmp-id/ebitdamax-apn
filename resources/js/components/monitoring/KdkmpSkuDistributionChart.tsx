import {
    Bar,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    ComposedChart,
} from 'recharts';
import { compactNumber } from '@/components/dashboard/chart-utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export type KdkmpSkuPoint = {
    kdkmp_id: number;
    nama: string;
    sku_count: number;
};

type Props = {
    title: string;
    description?: string;
    data: KdkmpSkuPoint[];
    average: number;
};

export default function KdkmpSkuDistributionChart({
    title,
    description,
    data,
    average,
}: Props) {
    const sorted = [...data].sort(
        (a, b) => a.sku_count - b.sku_count || a.kdkmp_id - b.kdkmp_id,
    );

    const chartData = sorted.map((point) => ({
        ...point,
        label: `#${point.kdkmp_id}`,
    }));

    const height = Math.max(360, sorted.length * 0.6);
    const showAllTicks = sorted.length <= 30;
    const tickInterval = showAllTicks ? 0 : Math.max(1, Math.floor(sorted.length / 12));

    return (
        <Card className="border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-foreground">{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>

            <CardContent style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 16, right: 24, left: 8, bottom: 24 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                        />
                        <XAxis
                            dataKey="label"
                            interval={tickInterval}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                            label={{
                                value: 'KDKMP (urut SKU terkecil ke terbesar)',
                                position: 'insideBottom',
                                offset: -8,
                                fill: 'var(--muted-foreground)',
                                fontSize: 12,
                            }}
                        />
                        <YAxis
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                            tickFormatter={(value) => compactNumber(value)}
                            label={{
                                value: 'Jumlah SKU',
                                angle: -90,
                                position: 'insideLeft',
                                fill: 'var(--muted-foreground)',
                                fontSize: 12,
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                color: 'var(--card-foreground)',
                            }}
                            itemStyle={{ color: 'var(--card-foreground)' }}
                            labelStyle={{ color: 'var(--muted-foreground)' }}
                            formatter={(_value, _name, context) => {
                                const point = context?.payload as
                                    | (typeof chartData)[number]
                                    | undefined;
                                return [
                                    `${context.value} SKU`,
                                    point?.nama ?? 'KDKMP',
                                ];
                            }}
                        />
                        <Bar
                            dataKey="sku_count"
                            name="Jumlah SKU"
                            fill="#2563eb"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={18}
                        />
                        <ReferenceLine
                            y={average}
                            stroke="#dc2626"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            label={{
                                value: `Rata-rata ${average}`,
                                position: 'right',
                                fill: '#dc2626',
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
