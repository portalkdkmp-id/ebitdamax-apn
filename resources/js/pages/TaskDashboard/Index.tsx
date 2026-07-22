import { Head } from '@inertiajs/react';
import { Camera, CheckCircle2, ClipboardList, Clock, Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { TaskAdditionalFieldItem, TaskItem } from '@/types/task';

type DashboardTask = TaskItem & {
    status: 'pending' | 'in_progress' | 'completed';
    status_label: string;
};

type Props = {
    tasks: DashboardTask[];
    summary: {
        total: number;
        pending: number;
        in_progress: number;
        completed: number;
    };
};

function fieldsFor(task: DashboardTask | null, showWhen: 'start' | 'finish') {
    return (
        task?.additional_fields.filter(
            (field) => field.show_when === showWhen,
        ) ?? []
    );
}

function FieldPreview({ field }: { field: TaskAdditionalFieldItem }) {
    if (field.input_type === 'textarea') {
        return (
            <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none"
                placeholder={field.label}
            />
        );
    }

    if (field.input_type === 'select') {
        return (
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Pilih {field.label}</option>
                {field.options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    }

    if (field.input_type === 'radio' || field.input_type === 'checkbox') {
        return (
            <div className="flex flex-wrap gap-3">
                {field.options.map((option) => (
                    <label
                        key={option}
                        className="flex items-center gap-2 text-sm"
                    >
                        <input
                            type={field.input_type}
                            name={field.field_name}
                            value={option}
                        />
                        {option}
                    </label>
                ))}
            </div>
        );
    }

    if (field.input_type === 'boolean') {
        return (
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" />
                Ya
            </label>
        );
    }

    const type =
        field.input_type === 'datetime' ? 'datetime-local' : field.input_type;

    return <Input type={type} placeholder={field.label} />;
}

export default function TaskDashboardIndex({ tasks, summary }: Props) {
    const [startTask, setStartTask] = useState<DashboardTask | null>(null);
    const [finishTask, setFinishTask] = useState<DashboardTask | null>(null);

    const startFields = useMemo(
        () => fieldsFor(startTask, 'start'),
        [startTask],
    );
    const finishFields = useMemo(
        () => fieldsFor(finishTask, 'finish'),
        [finishTask],
    );

    return (
        <>
            <Head title="Dashboard Task" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                Dashboard Task
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Task Saya
                            </h1>
                            <p className="mt-2 max-w-3xl text-muted-foreground">
                                Daftar task berdasarkan role user yang sedang
                                login.
                            </p>
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-4">
                        <SummaryCard label="Total Task" value={summary.total} />
                        <SummaryCard
                            label="Belum Dimulai"
                            value={summary.pending}
                        />
                        <SummaryCard
                            label="Sedang Dikerjakan"
                            value={summary.in_progress}
                        />
                        <SummaryCard
                            label="Selesai"
                            value={summary.completed}
                        />
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardHeader className="border-b">
                            <CardTitle>Daftar Task</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="min-w-[280px] p-4">
                                            Nama Task
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Kategori
                                        </TableHead>
                                        <TableHead className="p-4">
                                            PIC Role
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            Estimasi Waktu
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Status
                                        </TableHead>
                                        <TableHead className="w-[190px] p-4 text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Belum ada task untuk role ini.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {tasks.map((task) => (
                                        <TableRow key={task.uuid}>
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <ClipboardList className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {task.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {task.description ??
                                                                '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                {task.task_category.name}
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <Badge>{task.role.name}</Badge>
                                            </TableCell>
                                            <TableCell className="p-4 text-right">
                                                {task.time_require} menit
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <Badge variant="outline">
                                                    {task.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    {task.status ===
                                                        'pending' && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() =>
                                                                setStartTask(
                                                                    task,
                                                                )
                                                            }
                                                        >
                                                            <Play className="size-4" />
                                                            Mulai Task
                                                        </Button>
                                                    )}
                                                    {task.status ===
                                                        'in_progress' && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() =>
                                                                setFinishTask(
                                                                    task,
                                                                )
                                                            }
                                                        >
                                                            <CheckCircle2 className="size-4" />
                                                            Selesaikan Task
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <TaskActionDialog
                title="Mulai Task"
                open={startTask !== null}
                onOpenChange={(open) => !open && setStartTask(null)}
                photoLabel="Foto Mulai"
                fields={startFields}
                submitLabel="Mulai"
            />

            <TaskActionDialog
                title="Selesaikan Task"
                open={finishTask !== null}
                onOpenChange={(open) => !open && setFinishTask(null)}
                photoLabel="Foto Selesai"
                fields={finishFields}
                submitLabel="Selesaikan"
            />
        </>
    );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <Card className="rounded-lg border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-primary">
                        {value}
                    </p>
                </div>
                <Clock className="size-5 text-primary" />
            </CardContent>
        </Card>
    );
}

function TaskActionDialog({
    title,
    open,
    onOpenChange,
    photoLabel,
    fields,
    submitLabel,
}: {
    title: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    photoLabel: string;
    fields: TaskAdditionalFieldItem[];
    submitLabel: string;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Lengkapi foto dan field tambahan yang dibutuhkan.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label>{photoLabel}</Label>
                        <div className="rounded-lg border bg-background p-4">
                            <div className="flex items-center gap-3">
                                <Camera className="size-5 text-primary" />
                                <Input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                />
                            </div>
                        </div>
                    </div>

                    {fields.map((field) => (
                        <div
                            key={field.id ?? field.field_name}
                            className="space-y-2"
                        >
                            <Label>
                                {field.label}
                                {field.is_required && (
                                    <span className="ml-1 text-destructive">
                                        *
                                    </span>
                                )}
                            </Label>
                            <FieldPreview field={field} />
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>
                    <Button type="button" disabled>
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
