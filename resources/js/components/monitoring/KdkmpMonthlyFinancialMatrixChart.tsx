import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { chartCurrency } from '@/components/dashboard/chart-utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type {
    KdkmpIdentity,
    KdkmpMonthlyFinancialMatrix,
    KdkmpMonthlyFinancialMatrixPoint,
} from '@/types/kdkmp-dashboard';

type Props = {
    kdkmp: KdkmpIdentity;
    matrix: KdkmpMonthlyFinancialMatrix;
    onDateClick: (date: string) => void;
};

function formatRupiah(value: unknown): string {
    const amount = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(amount)) {
        return '-';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function formatAxisDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
    }).format(new Date(`${value}T00:00:00`));
}

function MonthlyMatrixTooltip({
    active,
    payload,
}: Partial<TooltipContentProps>) {
    const point = payload?.[0]?.payload as
        KdkmpMonthlyFinancialMatrixPoint | undefined;

    if (!active || !point) {
        return null;
    }

    return (
        <div className="w-80 rounded-lg border bg-card p-3 text-sm shadow-lg">
            <p className="font-semibold text-foreground">
                {formatDate(point.date)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
                <span>Plan Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.plan_cost)}
                </span>
                <span>Actual Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.actual_cost)}
                </span>
                <span>Plan Cost Kumulatif</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.cumulative_plan_cost)}
                </span>
                <span>Actual Cost Kumulatif</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.cumulative_actual_cost)}
                </span>
                <span>Plan Revenue</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.plan_revenue)}
                </span>
                <span>Actual Revenue</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.actual_revenue)}
                </span>
            </div>
        </div>
    );
}

export default function KdkmpMonthlyFinancialMatrixChart({
    kdkmp,
    matrix,
    onDateClick,
}: Props) {
    const handleChartClick = (event: unknown) => {
        const point = (
            event as {
                activePayload?: Array<{
                    payload?: KdkmpMonthlyFinancialMatrixPoint;
                }>;
            }
        ).activePayload?.[0]?.payload;

        if (point?.date) {
            onDateClick(point.date);
        }
    };

    return (
        <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-xl text-foreground">
                    Grafik Akumulasi Harian: {kdkmp.name}
                </CardTitle>
                <CardDescription>
                    Data KDKMP di Desa {kdkmp.desa ?? '-'}, dari{' '}
                    {formatDate(matrix.start_date)} sampai{' '}
                    {formatDate(matrix.end_date)}. Klik titik atau batang pada
                    tanggal tertentu untuk membuka rincian KDKMP.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
                {!matrix.has_data ? (
                    <div className="flex h-80 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Belum ada KDKMP pada cakupan wilayah ini.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="h-[500px] min-w-[1080px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={matrix.points}
                                    margin={{
                                        top: 24,
                                        right: 28,
                                        left: 12,
                                        bottom: 30,
                                    }}
                                    onClick={handleChartClick}
                                    className="cursor-pointer"
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatAxisDate}
                                        minTickGap={22}
                                        label={{
                                            value: 'TANGGAL (MONTH TO DATE)',
                                            position: 'insideBottom',
                                            offset: -12,
                                            fill: 'var(--foreground)',
                                            fontSize: 12,
                                            fontWeight: 600,
                                        }}
                                        tick={{
                                            fill: 'var(--muted-foreground)',
                                            fontSize: 10,
                                        }}
                                    />
                                    <YAxis
                                        tickFormatter={chartCurrency}
                                        label={{
                                            value: 'RUPIAH',
                                            angle: -90,
                                            position: 'insideLeft',
                                            offset: -2,
                                            fill: 'var(--foreground)',
                                            fontSize: 12,
                                            fontWeight: 600,
                                        }}
                                        tick={{
                                            fill: 'var(--muted-foreground)',
                                            fontSize: 11,
                                        }}
                                    />
                                    <Tooltip
                                        content={<MonthlyMatrixTooltip />}
                                    />
                                    <Legend verticalAlign="top" height={56} />
                                    <Bar
                                        dataKey="plan_cost"
                                        name="Plan Cost"
                                        fill="#2563eb"
                                        maxBarSize={28}
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="actual_cost"
                                        name="Actual Cost"
                                        fill="#dc2626"
                                        maxBarSize={28}
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="cumulative_plan_cost"
                                        name="Plan Cost Kumulatif"
                                        stroke="#ca8a04"
                                        strokeWidth={3}
                                        strokeDasharray="2 7"
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="cumulative_actual_cost"
                                        name="Actual Cost Kumulatif"
                                        stroke="#15803d"
                                        strokeWidth={3}
                                        strokeDasharray="2 7"
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="plan_revenue"
                                        name="Plan Revenue"
                                        stroke="#0f766e"
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="actual_revenue"
                                        name="Actual Revenue"
                                        stroke="#7c3aed"
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
