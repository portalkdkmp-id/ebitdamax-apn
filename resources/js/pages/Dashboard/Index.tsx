import { Head } from '@inertiajs/react';
import CostBreakdownChart from '@/components/dashboard/CostBreakdownChart';
import DashboardFilter from '@/components/dashboard/DashboardFilter';
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards';
import DashboardOrganizationTree from '@/components/dashboard/DashboardOrganizationTree';
import EbitdaByDirectorateChart from '@/components/dashboard/EbitdaByDirectorateChart';
import MarginRankingChart from '@/components/dashboard/MarginRankingChart';
import NegativeEbitdaAlertTable from '@/components/dashboard/NegativeEbitdaAlertTable';
import RevenueByDirectorateChart from '@/components/dashboard/RevenueByDirectorateChart';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import type { ExecutiveDashboardProps } from '@/types/dashboard';

export default function DashboardIndex({
    year,
    scenario,
    summary,
    tree,
    charts,
    alerts,
}: ExecutiveDashboardProps) {
    return (
        <>
            <Head title="Dashboard EBITDAMAX APN" />

            <div className="min-h-screen bg-background">
                <div className="space-y-6 p-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-sm font-medium tracking-wide text-primary uppercase">
                            Executive Dashboard
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-foreground">
                            Dashboard EBITDAMAX APN
                        </h1>

                        <p className="mt-2 max-w-4xl text-muted-foreground">
                            Dashboard ini menampilkan Revenue, Cost Breakdown,
                            EBITDA by Directorate, Ranking EBITDA Margin, dan
                            Alert Area Pemborosan Cost berdasarkan hasil import
                            Excel.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Badge className="bg-primary text-primary-foreground">
                                Tahun {year}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="border-primary/25 bg-primary/5 text-primary"
                            >
                                Scenario: {scenario}
                            </Badge>
                        </div>
                    </div>

                    <DashboardFilter
                        year={year}
                        scenario={scenario}
                        action={dashboard.url()}
                    />

                    <DashboardKpiCards summary={summary} />

                    <div className="grid gap-6 xl:grid-cols-2">
                        <RevenueByDirectorateChart
                            data={charts.revenue_by_directorate}
                        />
                        <CostBreakdownChart data={charts.cost_breakdown} />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <EbitdaByDirectorateChart
                            data={charts.ebitda_by_directorate}
                        />
                        <MarginRankingChart data={charts.margin_ranking} />
                    </div>

                    <NegativeEbitdaAlertTable data={alerts.negative_ebitda} />

                    <DashboardOrganizationTree tree={tree} />
                </div>
            </div>
        </>
    );
}

DashboardIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
