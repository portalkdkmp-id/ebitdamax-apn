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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    KdkmpFinancialMatrix,
    KdkmpFinancialMatrixPoint,
} from '@/types/kdkmp-dashboard';

type Props = {
    matrix: KdkmpFinancialMatrix;
    selectedDate: string;
    maxDate: string;
    isLoading: boolean;
    onDateChange: (date: string) => void;
};

type ChartPoint = KdkmpFinancialMatrixPoint & {
    plan_revenue: number | null;
    actual_revenue: number | null;
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

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
        return `${remainingMinutes} menit`;
    }

    if (remainingMinutes === 0) {
        return `${hours} jam`;
    }

    return `${hours} jam ${remainingMinutes} menit`;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function MatrixMetric({
    label,
    value,
    tone,
}: {
    label: string;
    value: number | null;
    tone: string;
}) {
    return (
        <div className="rounded-lg border bg-background/80 p-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className={`mt-1 text-sm font-bold tabular-nums ${tone}`}>
                {formatRupiah(value)}
            </p>
        </div>
    );
}

function MatrixTooltip({ active, payload }: Partial<TooltipContentProps>) {
    const point = payload?.[0]?.payload as ChartPoint | undefined;

    if (!active || !point) {
        return null;
    }

    return (
        <div className="w-72 rounded-lg border bg-card p-3 text-sm shadow-lg">
            <p className="font-semibold text-foreground">
                Proses {point.process}: {point.task_name}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
                <span>Estimasi</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatDuration(point.estimated_minutes)}
                </span>
                <span>Durasi selesai</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatDuration(point.actual_duration_minutes)}
                </span>
                <span>Plan Fixed Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.plan_fixed_cost)}
                </span>
                <span>Plan Variable Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.plan_variable_cost)}
                </span>
                <span>Plan Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.plan_cost)}
                </span>
                <span>Actual Fixed Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.actual_fixed_cost)}
                </span>
                <span>Actual Variable Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.actual_variable_cost)}
                </span>
                <span>Actual Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.actual_cost)}
                </span>
                <span>Plan Cost kumulatif</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.cumulative_plan_cost)}
                </span>
                <span>Actual Cost kumulatif</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.cumulative_actual_cost)}
                </span>
            </div>
        </div>
    );
}

export default function KdkmpFinancialMatrixChart({
    matrix,
    selectedDate,
    maxDate,
    isLoading,
    onDateChange,
}: Props) {
    const chartData: ChartPoint[] = matrix.points.map((point) => ({
        ...point,
        plan_revenue: matrix.plan_revenue,
        actual_revenue: matrix.actual_revenue,
    }));
    return (
        <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="border-b bg-muted/20">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1.5">
                        <CardTitle className="text-xl text-foreground">
                            The{' '}
                            <span className="text-primary">EBITDA Matrix</span>{' '}
                            <span className="font-normal text-muted-foreground">
                                (Indikator Finansial untuk Proses Bisnis)
                            </span>
                        </CardTitle>
                        <CardDescription>
                            Perbandingan pendapatan dan biaya per proses bisnis
                            berdasarkan rencana serta durasi aktual task pada{' '}
                            {formatDate(selectedDate)}.
                        </CardDescription>
                    </div>

                    <div className="w-full space-y-2 sm:w-56">
                        <Label htmlFor="financial-matrix-date">
                            Tanggal Grafik
                        </Label>
                        <Input
                            id="financial-matrix-date"
                            type="date"
                            max={maxDate}
                            value={selectedDate}
                            disabled={isLoading}
                            aria-busy={isLoading}
                            onChange={(event) =>
                                onDateChange(event.target.value)
                            }
                        />
                        {isLoading && (
                            <p className="text-xs text-muted-foreground">
                                Memuat data grafik...
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent
                className={`space-y-5 p-5 transition-opacity ${isLoading ? 'opacity-60' : 'opacity-100'}`}
            >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <MatrixMetric
                        label="Plan EBITDA"
                        value={matrix.plan_ebitda}
                        tone="text-sky-700 dark:text-sky-400"
                    />
                    <MatrixMetric
                        label="Actual EBITDA"
                        value={matrix.actual_ebitda}
                        tone="text-emerald-700 dark:text-emerald-400"
                    />
                    <MatrixMetric
                        label="Total Plan Cost"
                        value={matrix.total_plan_cost}
                        tone="text-slate-700 dark:text-slate-300"
                    />
                    <MatrixMetric
                        label="Total Actual Cost"
                        value={matrix.total_actual_cost}
                        tone="text-amber-700 dark:text-amber-400"
                    />
                    <MatrixMetric
                        label="Total Actual Variable Cost"
                        value={matrix.total_actual_variable_cost}
                        tone="text-violet-700 dark:text-violet-400"
                    />
                </div>

                {chartData.length === 0 ? (
                    <div className="flex h-80 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Belum ada task untuk tanggal grafik yang dipilih.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="h-[500px] min-w-[1080px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={chartData}
                                    margin={{
                                        top: 24,
                                        right: 28,
                                        left: 12,
                                        bottom: 88,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="task_name"
                                        angle={-42}
                                        height={108}
                                        interval={0}
                                        textAnchor="end"
                                        label={{
                                            value: 'BUSINESS PROCESS / TASK',
                                            position: 'insideBottom',
                                            offset: -72,
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
                                    <Tooltip content={<MatrixTooltip />} />
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
                                        connectNulls={false}
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="actual_revenue"
                                        name="Actual Revenue"
                                        stroke="#15803d"
                                        strokeWidth={3}
                                        dot={false}
                                        connectNulls={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-4">
                    <p>
                        Total estimasi:{' '}
                        <span className="font-medium text-foreground">
                            {formatDuration(matrix.total_estimated_minutes)}
                        </span>
                    </p>
                    <p>
                        Durasi selesai:{' '}
                        <span className="font-medium text-foreground">
                            {formatDuration(
                                matrix.total_actual_duration_minutes,
                            )}
                        </span>
                    </p>
                    <p>
                        Total Plan Fixed Cost:{' '}
                        <span className="font-medium text-foreground">
                            {formatRupiah(matrix.fixed_cost)}
                        </span>
                    </p>
                    <p>
                        Total Plan Variable Cost:{' '}
                        <span className="font-medium text-foreground">
                            {formatRupiah(matrix.total_variable_cost)}
                        </span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
