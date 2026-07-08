import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { compactNumber } from '@/components/dashboard/chart-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TONE_HEX: Record<string, string> = {
    default: '#2563eb',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    neutral: '#94a3b8',
};

export type IndicatorBarItem = {
    label: string;
    value: number;
    tone?: keyof typeof TONE_HEX;
};

type Props = {
    title: string;
    data: IndicatorBarItem[];
};

export default function IndicatorBarChart({ title, data }: Props) {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const height = Math.max(sorted.length * 40, 200);

    return (
        <Card className="border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-foreground">
                    {title}
                </CardTitle>
            </CardHeader>

            <CardContent style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sorted}
                        layout="vertical"
                        margin={{ left: 8, right: 24 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke="var(--border)"
                        />
                        <XAxis
                            type="number"
                            tick={{ fill: 'var(--muted-foreground)' }}
                            tickFormatter={(value) => compactNumber(value)}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={180}
                            tick={{
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
                            formatter={(value) => [
                                Number(value).toLocaleString('id-ID'),
                                'Jumlah',
                            ]}
                        />
                        <Bar
                            dataKey="value"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={24}
                        >
                            {sorted.map((item) => (
                                <Cell
                                    key={item.label}
                                    fill={TONE_HEX[item.tone ?? 'default']}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
