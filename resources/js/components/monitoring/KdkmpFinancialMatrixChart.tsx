import {
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
    KdkmpFinancialMatrix,
    KdkmpFinancialMatrixPoint,
} from '@/types/kdkmp-dashboard';

type Props = {
    matrix: KdkmpFinancialMatrix;
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
                <span>Variable Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.variable_cost)}
                </span>
                <span>Actual Cost</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.actual_cost)}
                </span>
                <span>Variable Cost kumulatif</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.cumulative_variable_cost)}
                </span>
                <span>Actual Cost kumulatif</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                    {formatRupiah(point.cumulative_actual_cost)}
                </span>
            </div>
        </div>
    );
}

export default function KdkmpFinancialMatrixChart({ matrix }: Props) {
    const chartData: ChartPoint[] = matrix.points.map((point) => ({
        ...point,
        plan_revenue: matrix.plan_revenue,
        actual_revenue: matrix.actual_revenue,
    }));
    const hasCostAllocation = matrix.total_estimated_minutes > 0;

    return (
        <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-xl text-foreground">
                    The <span className="text-primary">EBITDA Matrix</span>{' '}
                    <span className="font-normal text-muted-foreground">
                        (Indikator Finansial untuk Proses Bisnis)
                    </span>
                </CardTitle>
                <CardDescription>
                    {/* Perbandingan pendapatan serta akumulasi biaya untuk setiap
                    urutan task hari ini. */}
                    Integrasi BPM dengan TD-ABC dan EBITDA untuk setiap urutan task hari ini.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
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
                        Belum ada task aktif yang ditugaskan ke role Anda.
                    </div>
                ) : !hasCostAllocation ? (
                    <div className="flex h-80 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Total estimasi waktu task masih 0 menit sehingga biaya
                        belum dapat dialokasikan.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="h-[430px] min-w-[760px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={chartData}
                                    margin={{
                                        top: 24,
                                        right: 28,
                                        left: 12,
                                        bottom: 18,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="process"
                                        label={{
                                            value: 'URUTAN TASK',
                                            position: 'insideBottom',
                                            offset: -8,
                                            fill: 'var(--foreground)',
                                            fontSize: 12,
                                            fontWeight: 600,
                                        }}
                                        tick={{
                                            fill: 'var(--muted-foreground)',
                                            fontSize: 11,
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
                                    <Legend verticalAlign="top" height={32} />
                                    <Line
                                        type="linear"
                                        dataKey="actual_revenue"
                                        name="Actual Revenue"
                                        stroke="#15803d"
                                        strokeWidth={3}
                                        dot={false}
                                        connectNulls={false}
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
                                        dataKey="cumulative_variable_cost"
                                        name="Variable Costs Kumulatif"
                                        stroke="#64748b"
                                        strokeWidth={3}
                                        strokeDasharray="2 7"
                                        dot={{ r: 3 }}
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="cumulative_actual_cost"
                                        name="Actual Costs Kumulatif"
                                        stroke="#c6a427"
                                        strokeWidth={3}
                                        strokeDasharray="2 7"
                                        dot={{ r: 3 }}
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
                        Fixed Cost:{' '}
                        <span className="font-medium text-foreground">
                            {formatRupiah(matrix.fixed_cost)}
                        </span>
                    </p>
                    <p>
                        Total Variable Cost:{' '}
                        <span className="font-medium text-foreground">
                            {formatRupiah(matrix.total_variable_cost)}
                        </span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
