import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import CostBreakdownChart from '@/components/dashboard/CostBreakdownChart';
import DashboardFilter from '@/components/dashboard/DashboardFilter';
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards';
import EbitdaByDirectorateChart from '@/components/dashboard/EbitdaByDirectorateChart';
import MarginRankingChart from '@/components/dashboard/MarginRankingChart';
import NegativeEbitdaAlertTable from '@/components/dashboard/NegativeEbitdaAlertTable';
import RevenueByDirectorateChart from '@/components/dashboard/RevenueByDirectorateChart';
import EbitdaTreeFlow from '@/components/ebitda-tree/EbitdaTreeFlow';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import { show as showDirectorate } from '@/routes/dashboard/directorates';
import type { DirectorateDashboardProps } from '@/types/dashboard';

export default function DirectorateDashboard({
    year,
    scenario,
    directorate,
    summary,
    tree,
    charts,
    alerts,
}: DirectorateDashboardProps) {
    return (
        <>
            <Head title={`Dashboard ${directorate.name}`} />

            <div className="min-h-screen bg-background">
                <div className="space-y-6 p-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <Link
                            href={dashboard()}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Dashboard Utama
                        </Link>

                        <div className="mt-4">
                            <p className="text-sm font-medium tracking-wide text-primary uppercase">
                                Dashboard Direktorat
                            </p>

                            <h1 className="mt-1 text-2xl font-bold text-foreground">
                                {directorate.name}
                            </h1>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <Badge className="bg-primary text-primary-foreground">
                                    {directorate.code}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-primary/25 bg-primary/5 text-primary"
                                >
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
                    </div>

                    <DashboardFilter
                        year={year}
                        scenario={scenario}
                        action={showDirectorate.url(directorate.slug)}
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

                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-sm font-medium tracking-wide text-primary uppercase">
                            Breakdown Pohon EBITDA Direktorat
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-foreground">
                            {directorate.code} - {directorate.name}
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                            Diagram ini menampilkan struktur child organisasi
                            dari direktorat yang dipilih beserta Revenue, DOC-V,
                            DOC-F, IOC, TOC, EBITDA, Margin, dan indikasi area
                            pemborosan.
                        </p>
                    </div>

                    <EbitdaTreeFlow tree={tree} />
                </div>
            </div>
        </>
    );
}

DirectorateDashboard.layout = ({ directorate }: DirectorateDashboardProps) => ({
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: directorate.name,
            href: showDirectorate(directorate.slug),
        },
    ],
});
