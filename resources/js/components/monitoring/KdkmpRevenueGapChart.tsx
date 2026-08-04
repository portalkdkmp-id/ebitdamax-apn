import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { chartCurrency } from '@/components/dashboard/chart-utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { KdkmpRevenueGapPoint } from '@/types/kdkmp-dashboard';

type Props = {
    data: KdkmpRevenueGapPoint[];
};

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
    }).format(new Date(`${value}T00:00:00`));
}

function formatRupiah(value: unknown): string {
    const amount = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(amount)) {
        return '-';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 2,
    }).format(amount);
}

export default function KdkmpRevenueGapChart({ data }: Props) {
    const hasRevenueData = data.some(
        (point) => point.plan_revenue !== null || point.actual_revenue !== null,
    );

    return (
        <Card className="border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-foreground">
                    Grafik Gap Pendapatan Harian
                </CardTitle>
                <CardDescription>
                    Akumulasi seluruh KDKMP: perbandingan Plan Revenue, Actual
                    Revenue, dan gap Actual dikurangi Plan Revenue dalam 30 hari
                    terakhir.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!hasRevenueData ? (
                    <div className="flex h-80 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Belum ada data Plan Revenue atau Actual Revenue dalam
                        periode ini.
                    </div>
                ) : (
                    <div className="h-96 min-w-[640px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={data}
                                margin={{
                                    top: 16,
                                    right: 24,
                                    left: 8,
                                    bottom: 16,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    minTickGap={24}
                                    tick={{
                                        fill: 'var(--muted-foreground)',
                                        fontSize: 11,
                                    }}
                                />
                                <YAxis
                                    yAxisId="revenue"
                                    tickFormatter={chartCurrency}
                                    tick={{
                                        fill: 'var(--muted-foreground)',
                                        fontSize: 11,
                                    }}
                                />
                                <YAxis
                                    yAxisId="gap"
                                    orientation="right"
                                    tickFormatter={chartCurrency}
                                    tick={{
                                        fill: 'var(--muted-foreground)',
                                        fontSize: 11,
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 8,
                                        color: 'var(--card-foreground)',
                                    }}
                                    labelFormatter={(value) =>
                                        `Tanggal: ${formatDate(String(value))}`
                                    }
                                    formatter={(value, name) => [
                                        formatRupiah(value),
                                        String(name),
                                    ]}
                                />
                                <Legend />
                                <Bar
                                    yAxisId="revenue"
                                    dataKey="plan_revenue"
                                    name="Plan Revenue"
                                    fill="#2563eb"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={24}
                                />
                                <Bar
                                    yAxisId="revenue"
                                    dataKey="actual_revenue"
                                    name="Actual Revenue"
                                    fill="#16a34a"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={24}
                                />
                                <ReferenceLine
                                    yAxisId="gap"
                                    y={0}
                                    stroke="var(--muted-foreground)"
                                    strokeDasharray="4 4"
                                />
                                <Line
                                    yAxisId="gap"
                                    type="monotone"
                                    dataKey="gap"
                                    name="Gap (Actual − Plan)"
                                    stroke="#ea580c"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    connectNulls={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
