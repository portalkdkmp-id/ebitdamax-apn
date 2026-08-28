import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    Clock3,
    ListChecks,
    MapPin,
    Store,
} from 'lucide-react';
import type { FormEvent } from 'react';
import KdkmpDashboardDailyInputForm from '@/components/kdkmp-dashboard-daily-input-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { index as dashboardIndex } from '@/routes/kdkmp-dashboard';
import { save as saveTaskSelection } from '@/routes/kdkmp-dashboard/task-selection';
import type {
    KdkmpComputedValues,
    KdkmpDailyEntry,
    KdkmpIdentity,
} from '@/types/kdkmp-dashboard';

type Props = {
    businessDate: string;
    kdkmp: KdkmpIdentity | null;
    todayEntry: KdkmpDailyEntry | null;
    computedValues: KdkmpComputedValues;
    taskSelection: {
        tasks: SelectableTask[];
        selected_task_ids: number[];
    };
};

type SelectableTask = {
    id: number;
    name: string;
    description: string | null;
    execution_time: string | null;
    time_require: number;
    is_mandatory: boolean;
    is_locked: boolean;
    bmc_status: string;
    bmc_status_label: string;
    task_category_name: string | null;
};

type SelectableTaskGroup = {
    bmcStatus: string;
    bmcStatusLabel: string;
    tasks: SelectableTask[];
};

const bmcStatusOrder = [
    'key_partnerships',
    'key_activities',
    'key_resources',
    'value_propositions',
    'customer_relationships',
    'channels',
    'customer_segments',
    'cost_structure',
    'revenue_streams',
    'belum_dipetakan',
];

function bmcStatusPosition(status: string): number {
    const position = bmcStatusOrder.indexOf(status);

    return position === -1 ? bmcStatusOrder.length : position;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function EntryStatus({ entry }: { entry: KdkmpDailyEntry | null }) {
    if (!entry) {
        return <Badge variant="outline">Belum diisi</Badge>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-600 text-white">Lengkap</Badge>
            {entry.plan_revenue_requires_review && (
                <Badge className="bg-rose-600 text-white">
                    Perlu review Plan Revenue
                </Badge>
            )}
        </div>
    );
}

function KdkmpTaskSelectionForm({
    taskSelection,
}: {
    taskSelection: Props['taskSelection'];
}) {
    const { data, setData, put, processing, errors } = useForm({
        selected_task_ids: taskSelection.selected_task_ids,
    });
    const taskGroups = taskSelection.tasks
        .reduce<SelectableTaskGroup[]>((groups, task) => {
            const group = groups.find(
                (item) => item.bmcStatus === task.bmc_status,
            );

            if (group) {
                group.tasks.push(task);

                return groups;
            }

            groups.push({
                bmcStatus: task.bmc_status,
                bmcStatusLabel: task.bmc_status_label,
                tasks: [task],
            });

            return groups;
        }, [])
        .sort(
            (left, right) =>
                bmcStatusPosition(left.bmcStatus) -
                bmcStatusPosition(right.bmcStatus),
        );
    const selectedTaskIds = new Set(data.selected_task_ids);

    const toggleTask = (taskId: number, isChecked: boolean) => {
        setData(
            'selected_task_ids',
            isChecked
                ? [...new Set([...data.selected_task_ids, taskId])]
                : data.selected_task_ids.filter(
                      (selectedTaskId) => selectedTaskId !== taskId,
                  ),
        );
    };

    const toggleBmcBundle = (taskIds: number[], isChecked: boolean) => {
        const taskIdLookup = new Set(taskIds);

        setData(
            'selected_task_ids',
            isChecked
                ? [...new Set([...data.selected_task_ids, ...taskIds])]
                : data.selected_task_ids.filter(
                      (taskId) => !taskIdLookup.has(taskId),
                  ),
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        put(saveTaskSelection.url(), {
            preserveScroll: true,
        });
    };

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ListChecks className="size-5 text-primary" />
                            Pilih Bundle BMC Hari Ini
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Task wajib selalu dijalankan. Untuk task tambahan,
                            setiap poin BMC yang dipilih akan menjalankan
                            seluruh task di dalam bundle tersebut.
                        </CardDescription>
                    </div>
                    <Badge variant="outline">
                        {taskSelection.tasks.length} task tersedia
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-5">
                {taskSelection.tasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                        Belum ada task aktif yang ditugaskan ke role Anda.
                    </p>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-5">
                            {taskGroups.map((group) => {
                                const isUnmappedGroup =
                                    group.bmcStatus === 'belum_dipetakan';
                                const optionalTasks = group.tasks.filter(
                                    (task) => !task.is_mandatory,
                                );
                                const optionalTaskIds = optionalTasks.map(
                                    (task) => task.id,
                                );
                                const selectedOptionalTaskCount =
                                    optionalTaskIds.filter((taskId) =>
                                        selectedTaskIds.has(taskId),
                                    ).length;
                                const isBundleSelected =
                                    optionalTaskIds.length > 0 &&
                                    selectedOptionalTaskCount ===
                                        optionalTaskIds.length;
                                const isBundlePartiallySelected =
                                    selectedOptionalTaskCount > 0 &&
                                    !isBundleSelected;
                                const isBundleLocked = optionalTasks.some(
                                    (task) => task.is_locked,
                                );

                                return (
                                    <section
                                        key={group.bmcStatus}
                                        className="overflow-hidden rounded-xl border bg-muted/10"
                                    >
                                        <header className="flex flex-col gap-3 border-b bg-background/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                    {isUnmappedGroup
                                                        ? 'Task tambahan'
                                                        : 'Bundle poin BMC'}
                                                </p>
                                                <h3 className="mt-0.5 font-semibold text-foreground">
                                                    {group.bmcStatusLabel}
                                                </h3>
                                                {isUnmappedGroup && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Task ini belum memiliki
                                                        poin BMC dan tetap dipilih
                                                        satu per satu.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="secondary">
                                                    {group.tasks.length} task
                                                </Badge>
                                                {!isUnmappedGroup &&
                                                    (optionalTaskIds.length ===
                                                    0 ? (
                                                        <Badge variant="outline">
                                                            Seluruh task wajib
                                                        </Badge>
                                                    ) : (
                                                        <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60">
                                                            <Checkbox
                                                                checked={
                                                                    isBundleSelected
                                                                        ? true
                                                                        : isBundlePartiallySelected
                                                                          ? 'indeterminate'
                                                                          : false
                                                                }
                                                                disabled={
                                                                    isBundleLocked
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    toggleBmcBundle(
                                                                        optionalTaskIds,
                                                                        checked ===
                                                                            true,
                                                                    )
                                                                }
                                                            />
                                                            Jalankan bundle
                                                        </label>
                                                    ))}
                                            </div>
                                        </header>
                                        <div className="space-y-3 p-3 sm:p-4">
                                            {group.tasks.map((task) => {
                                                const isChecked =
                                                    task.is_mandatory ||
                                                    selectedTaskIds.has(task.id);
                                                const isDisabled =
                                                    task.is_mandatory ||
                                                    task.is_locked;
                                                const taskContent = (
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex flex-wrap items-center gap-2">
                                                            <span className="font-medium text-foreground">
                                                                {task.name}
                                                            </span>
                                                            <Badge
                                                                variant={
                                                                    task.is_mandatory
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                            >
                                                                {task.is_mandatory
                                                                    ? 'Wajib'
                                                                    : 'Pilihan'}
                                                            </Badge>
                                                            {task.is_locked && (
                                                                <Badge variant="secondary">
                                                                    Sedang dikerjakan
                                                                </Badge>
                                                            )}
                                                        </span>
                                                        <span className="mt-1 block text-sm text-muted-foreground">
                                                            {task.task_category_name ??
                                                                'Tanpa kategori'}
                                                            {task.execution_time &&
                                                                ` · ${task.execution_time}`}
                                                            {' · '}
                                                            {task.time_require} menit
                                                        </span>
                                                        {task.description && (
                                                            <span className="mt-2 line-clamp-2 block text-sm text-muted-foreground">
                                                                {task.description}
                                                            </span>
                                                        )}
                                                        {task.is_locked && (
                                                            <span className="mt-2 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                                                                <Clock3 className="size-3.5" />
                                                                Selesaikan task ini sebelum
                                                                mengubah pilihannya.
                                                            </span>
                                                        )}
                                                    </span>
                                                );

                                                if (!isUnmappedGroup) {
                                                    return (
                                                        <div
                                                            key={task.id}
                                                            className="flex items-start gap-3 rounded-lg border bg-background p-4"
                                                        >
                                                            <span
                                                                className={
                                                                    isChecked
                                                                        ? 'mt-1 size-2.5 shrink-0 rounded-full bg-primary'
                                                                        : 'mt-1 size-2.5 shrink-0 rounded-full border border-muted-foreground/50'
                                                                }
                                                            />
                                                            {taskContent}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <label
                                                        key={task.id}
                                                        className="flex items-start gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            disabled={isDisabled}
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                toggleTask(
                                                                    task.id,
                                                                    checked ===
                                                                        true,
                                                                )
                                                            }
                                                        />
                                                        {taskContent}
                                                    </label>
                                                );
                                            })}
                                            {isBundleLocked && !isUnmappedGroup && (
                                                <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                                                    <Clock3 className="size-3.5" />
                                                    Selesaikan task yang sedang
                                                    dikerjakan sebelum mengubah
                                                    bundle ini.
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>

                        {errors.selected_task_ids && (
                            <p className="text-sm text-destructive">
                                {errors.selected_task_ids}
                            </p>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Pilihan Task'}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

export default function KdkmpDashboardInput({
    businessDate,
    kdkmp,
    todayEntry,
    computedValues,
    taskSelection,
}: Props) {
    return (
        <>
            <Head title="Input Data Hari Ini" />

            <main className="min-h-screen bg-background p-4 sm:p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <section className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                    >
                                        <Link href={dashboardIndex()}>
                                            <ArrowLeft className="size-4" />
                                            <span className="sr-only">
                                                Kembali ke Dashboard KDKMP
                                            </span>
                                        </Link>
                                    </Button>
                                    <p className="text-sm font-medium tracking-wide text-primary uppercase">
                                        Laporan Harian
                                    </p>
                                </div>
                                <h1 className="mt-2 text-2xl font-bold text-foreground">
                                    Input Data Hari Ini
                                </h1>
                                <p className="mt-2 text-muted-foreground">
                                    Isi pendapatan, biaya, dan kehadiran
                                    operasional KDKMP untuk hari ini.
                                </p>
                            </div>
                            <EntryStatus entry={todayEntry} />
                        </div>
                    </section>

                    {!kdkmp ? (
                        <Alert variant="destructive">
                            <Building2 />
                            <AlertTitle>Akun belum terhubung</AlertTitle>
                            <AlertDescription>
                                Akun Anda belum memiliki relasi ke data KDKMP.
                                Hubungi superadmin sebelum mengisi laporan
                                harian.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <div className="grid gap-4 lg:grid-cols-3">
                                <Card>
                                    <CardContent className="flex gap-3 p-5">
                                        <div className="h-fit rounded-full bg-primary/10 p-3 text-primary">
                                            <Store className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                KDKMP
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {kdkmp.name}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                NIK {kdkmp.nik ?? '-'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="flex gap-3 p-5">
                                        <div className="h-fit rounded-full bg-sky-500/10 p-3 text-sky-600">
                                            <MapPin className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Wilayah
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {kdkmp.desa ?? '-'},{' '}
                                                {kdkmp.kecamatan ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {kdkmp.kota_kabupaten ?? '-'},{' '}
                                                {kdkmp.provinsi ?? '-'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="flex gap-3 p-5">
                                        <div className="h-fit rounded-full bg-amber-500/10 p-3 text-amber-600">
                                            <CalendarDays className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Tanggal Laporan
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {formatDate(businessDate)}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Mengikuti waktu Asia/Jakarta
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <KdkmpDashboardDailyInputForm
                                todayEntry={todayEntry}
                                computedValues={computedValues}
                            />

                            <KdkmpTaskSelectionForm
                                taskSelection={taskSelection}
                            />
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
