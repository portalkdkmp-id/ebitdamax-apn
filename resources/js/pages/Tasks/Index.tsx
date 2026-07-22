import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    destroy as destroyTask,
    index as tasksIndex,
    store as storeTask,
    update as updateTask,
} from '@/routes/tasks';
import type {
    TaskAdditionalFieldInputType,
    TaskAdditionalFieldItem,
    TaskAdditionalFieldShowWhen,
    TaskCategoryOption,
    TaskFilters,
    TaskItem,
    TaskPaginatedResponse,
    TaskSelectOption,
} from '@/types/task';
import type { UserRole } from '@/types/user';

type Props = {
    tasks: TaskPaginatedResponse;
    taskCategories: TaskCategoryOption[];
    roles: UserRole[];
    inputTypeOptions: TaskSelectOption[];
    showWhenOptions: TaskSelectOption[];
    filters: TaskFilters;
};

type TaskFormData = {
    task_category_id: string;
    role_id: string;
    name: string;
    description: string;
    time_require: string;
    is_active: boolean;
    additional_fields: TaskAdditionalFieldItem[];
};

const optionTypes = ['select', 'radio', 'checkbox'];

const emptyField = (): TaskAdditionalFieldItem => ({
    label: '',
    input_type: 'text',
    show_when: 'start',
    is_required: false,
    options: [],
});

const defaultForm: TaskFormData = {
    task_category_id: '',
    role_id: '',
    name: '',
    description: '',
    time_require: '30',
    is_active: true,
    additional_fields: [],
};

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}

function paginationLabel(label: string) {
    if (label.includes('Previous')) {
        return 'Sebelumnya';
    }

    if (label.includes('Next')) {
        return 'Berikutnya';
    }

    return label;
}

function toFormData(task: TaskItem): TaskFormData {
    return {
        task_category_id: String(task.task_category_id),
        role_id: String(task.role_id),
        name: task.name,
        description: task.description ?? '',
        time_require: String(task.time_require),
        is_active: task.is_active,
        additional_fields: task.additional_fields.map((field) => ({
            id: field.id,
            label: field.label,
            input_type: field.input_type,
            show_when: field.show_when,
            is_required: field.is_required,
            options: field.options ?? [],
        })),
    };
}

export default function TasksIndex({
    tasks,
    taskCategories,
    roles,
    inputTypeOptions,
    showWhenOptions,
    filters,
}: Props) {
    const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterForm, setFilterForm] = useState({
        search: filters.search ?? '',
        task_category_id: filters.task_category_id
            ? String(filters.task_category_id)
            : 'all',
        role_id: filters.role_id ? String(filters.role_id) : 'all',
        status: filters.status ?? 'active',
        sort: filters.sort ?? 'name',
        direction: filters.direction ?? 'asc',
    });

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<TaskFormData>(defaultForm);

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            tasksIndex.url(),
            {
                search: filterForm.search,
                task_category_id:
                    filterForm.task_category_id === 'all'
                        ? undefined
                        : filterForm.task_category_id,
                role_id:
                    filterForm.role_id === 'all'
                        ? undefined
                        : filterForm.role_id,
                status: filterForm.status,
                sort: filterForm.sort,
                direction: filterForm.direction,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const openCreateForm = () => {
        setSelectedTask(null);
        clearErrors();
        reset();
        setData(defaultForm);
        setIsFormOpen(true);
    };

    const openEditForm = (task: TaskItem) => {
        setSelectedTask(task);
        clearErrors();
        setData(toFormData(task));
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setSelectedTask(null);
        reset();
        clearErrors();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (selectedTask) {
            put(updateTask.url(selectedTask.id), options);

            return;
        }

        post(storeTask.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(destroyTask.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const updateField = (
        index: number,
        field: keyof TaskAdditionalFieldItem,
        value: string | boolean | string[],
    ) => {
        const updated = [...data.additional_fields];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };

        if (field === 'input_type' && !optionTypes.includes(value as string)) {
            updated[index].options = [];
        }

        setData('additional_fields', updated);
    };

    const addAdditionalField = () => {
        setData('additional_fields', [...data.additional_fields, emptyField()]);
    };

    const removeAdditionalField = (index: number) => {
        setData(
            'additional_fields',
            data.additional_fields.filter(
                (_, fieldIndex) => fieldIndex !== index,
            ),
        );
    };

    const addOption = (fieldIndex: number) => {
        const updated = [...data.additional_fields];
        updated[fieldIndex] = {
            ...updated[fieldIndex],
            options: [...(updated[fieldIndex].options ?? []), ''],
        };
        setData('additional_fields', updated);
    };

    const updateOption = (
        fieldIndex: number,
        optionIndex: number,
        value: string,
    ) => {
        const updated = [...data.additional_fields];
        const options = [...(updated[fieldIndex].options ?? [])];
        options[optionIndex] = value;
        updated[fieldIndex] = { ...updated[fieldIndex], options };
        setData('additional_fields', updated);
    };

    const removeOption = (fieldIndex: number, optionIndex: number) => {
        const updated = [...data.additional_fields];
        updated[fieldIndex] = {
            ...updated[fieldIndex],
            options: updated[fieldIndex].options.filter(
                (_, index) => index !== optionIndex,
            ),
        };
        setData('additional_fields', updated);
    };

    return (
        <>
            <Head title="Tasks" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                Master Task
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Tasks
                            </h1>
                            <p className="mt-2 max-w-3xl text-muted-foreground">
                                Kelola master task, PIC role, status aktif, dan
                                additional field dinamis untuk proses mulai atau
                                selesai task.
                            </p>
                        </div>

                        <Button type="button" onClick={openCreateForm}>
                            <Plus className="size-4" />
                            Tambah Task
                        </Button>
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardContent className="p-5">
                            <form
                                onSubmit={submitFilters}
                                className="grid gap-4 lg:grid-cols-[1fr_190px_190px_150px_150px_140px_auto]"
                            >
                                <div className="space-y-2">
                                    <Label>Search</Label>
                                    <div className="relative">
                                        <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                                        <Input
                                            value={filterForm.search}
                                            onChange={(event) =>
                                                setFilterForm((current) => ({
                                                    ...current,
                                                    search: event.target.value,
                                                }))
                                            }
                                            placeholder="Cari task, kategori, atau role"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <FilterSelect
                                    label="Kategori"
                                    value={filterForm.task_category_id}
                                    onValueChange={(value) =>
                                        setFilterForm((current) => ({
                                            ...current,
                                            task_category_id: value,
                                        }))
                                    }
                                    items={taskCategories.map((category) => ({
                                        value: String(category.id),
                                        label: category.name,
                                    }))}
                                />

                                <FilterSelect
                                    label="PIC Role"
                                    value={filterForm.role_id}
                                    onValueChange={(value) =>
                                        setFilterForm((current) => ({
                                            ...current,
                                            role_id: value,
                                        }))
                                    }
                                    items={roles.map((role) => ({
                                        value: String(role.id),
                                        label: role.name,
                                    }))}
                                />

                                <FilterSelect
                                    label="Status"
                                    value={filterForm.status}
                                    onValueChange={(value) =>
                                        setFilterForm((current) => ({
                                            ...current,
                                            status:
                                                value === 'inactive'
                                                    ? 'inactive'
                                                    : value === 'all'
                                                      ? 'all'
                                                      : 'active',
                                        }))
                                    }
                                    includeAll={false}
                                    items={[
                                        { value: 'active', label: 'Active' },
                                        {
                                            value: 'inactive',
                                            label: 'Non Active',
                                        },
                                        { value: 'all', label: 'Semua' },
                                    ]}
                                />

                                <FilterSelect
                                    label="Sorting"
                                    value={filterForm.sort}
                                    onValueChange={(value) =>
                                        setFilterForm((current) => ({
                                            ...current,
                                            sort: value,
                                        }))
                                    }
                                    includeAll={false}
                                    items={[
                                        { value: 'name', label: 'Nama' },
                                        {
                                            value: 'time_require',
                                            label: 'Waktu',
                                        },
                                        {
                                            value: 'created_at',
                                            label: 'Dibuat',
                                        },
                                    ]}
                                />

                                <FilterSelect
                                    label="Arah"
                                    value={filterForm.direction}
                                    onValueChange={(value) =>
                                        setFilterForm((current) => ({
                                            ...current,
                                            direction:
                                                value === 'desc'
                                                    ? 'desc'
                                                    : 'asc',
                                        }))
                                    }
                                    includeAll={false}
                                    items={[
                                        { value: 'asc', label: 'Ascending' },
                                        { value: 'desc', label: 'Descending' },
                                    ]}
                                />

                                <div className="flex items-end">
                                    <Button type="submit" className="w-full">
                                        Filter
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between gap-4">
                                <CardTitle>Data Task</CardTitle>
                                <Badge variant="outline">
                                    {tasks.total} task
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="min-w-[280px] p-4">
                                            Task
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Kategori
                                        </TableHead>
                                        <TableHead className="p-4">
                                            PIC Role
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            Estimasi
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Status
                                        </TableHead>
                                        <TableHead className="w-[180px] p-4 text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Data task belum tersedia.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {tasks.data.map((task) => (
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
                                                            {
                                                                task
                                                                    .additional_fields
                                                                    .length
                                                            }{' '}
                                                            additional field
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
                                                {task.is_active ? (
                                                    <Badge>
                                                        <CheckCircle2 className="size-3" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        Non Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditForm(task)
                                                        }
                                                    >
                                                        <Pencil className="size-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDeleteTarget(
                                                                task,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {tasks.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {tasks.from ?? 0}-{tasks.to ?? 0}{' '}
                                dari {tasks.total} task
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {tasks.links.map((link) => (
                                    <Button
                                        key={`${link.label}-${link.url}`}
                                        type="button"
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.visit(link.url, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                });
                                            }
                                        }}
                                    >
                                        {paginationLabel(link.label)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <form onSubmit={submit} className="space-y-6">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedTask ? 'Edit Task' : 'Tambah Task'}
                            </DialogTitle>
                            <DialogDescription>
                                Tambahkan additional field sesuai kebutuhan
                                task.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormSelect
                                label="Kategori"
                                value={data.task_category_id}
                                onValueChange={(value) =>
                                    setData('task_category_id', value)
                                }
                                placeholder="Pilih kategori"
                                items={taskCategories.map((category) => ({
                                    value: String(category.id),
                                    label: category.name,
                                }))}
                                error={errors.task_category_id}
                            />

                            <FormSelect
                                label="PIC Role"
                                value={data.role_id}
                                onValueChange={(value) =>
                                    setData('role_id', value)
                                }
                                placeholder="Pilih role"
                                items={roles.map((role) => ({
                                    value: String(role.id),
                                    label: `${role.name} - ${role.level_label}`,
                                }))}
                                error={errors.role_id}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                            <div className="space-y-2">
                                <Label>Nama Task</Label>
                                <Input
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                    placeholder="Contoh: Input uang masuk"
                                />
                                <FieldError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label>Estimasi Waktu</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={data.time_require}
                                    onChange={(event) =>
                                        setData(
                                            'time_require',
                                            event.target.value,
                                        )
                                    }
                                />
                                <FieldError message={errors.time_require} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Deskripsi</Label>
                            <textarea
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            />
                            <FieldError message={errors.description} />
                        </div>

                        <label className="flex items-center gap-3 rounded-lg border bg-background p-3 text-sm">
                            <Checkbox
                                checked={data.is_active}
                                onCheckedChange={(checked) =>
                                    setData('is_active', checked === true)
                                }
                            />
                            Active
                        </label>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        Additional Field
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Field akan muncul saat mulai atau
                                        menyelesaikan task sesuai pengaturan.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addAdditionalField}
                                >
                                    <Plus className="size-4" />
                                    Tambah Field
                                </Button>
                            </div>

                            {data.additional_fields.length === 0 && (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Belum ada additional field.
                                </div>
                            )}

                            {data.additional_fields.map((field, index) => (
                                <div
                                    key={index}
                                    className="space-y-4 rounded-lg border bg-background p-4"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="font-medium">
                                            Field {index + 1}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                removeAdditionalField(index)
                                            }
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Label</Label>
                                            <Input
                                                value={field.label}
                                                onChange={(event) =>
                                                    updateField(
                                                        index,
                                                        'label',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: Uang Masuk"
                                            />
                                            <FieldError
                                                message={
                                                    errors[
                                                        `additional_fields.${index}.label`
                                                    ]
                                                }
                                            />
                                        </div>

                                        <FormSelect
                                            label="Tipe"
                                            value={field.input_type}
                                            onValueChange={(value) =>
                                                updateField(
                                                    index,
                                                    'input_type',
                                                    value as TaskAdditionalFieldInputType,
                                                )
                                            }
                                            items={inputTypeOptions}
                                            error={
                                                errors[
                                                    `additional_fields.${index}.input_type`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormSelect
                                            label="Tampil Saat"
                                            value={field.show_when}
                                            onValueChange={(value) =>
                                                updateField(
                                                    index,
                                                    'show_when',
                                                    value as TaskAdditionalFieldShowWhen,
                                                )
                                            }
                                            items={showWhenOptions}
                                            error={
                                                errors[
                                                    `additional_fields.${index}.show_when`
                                                ]
                                            }
                                        />

                                        <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                                            <Checkbox
                                                checked={field.is_required}
                                                onCheckedChange={(checked) =>
                                                    updateField(
                                                        index,
                                                        'is_required',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            Wajib diisi
                                        </label>
                                    </div>

                                    {optionTypes.includes(field.input_type) && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label>Opsi</Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        addOption(index)
                                                    }
                                                >
                                                    <Plus className="size-4" />
                                                    Tambah Opsi
                                                </Button>
                                            </div>

                                            {(field.options ?? []).map(
                                                (option, optionIndex) => (
                                                    <div
                                                        key={optionIndex}
                                                        className="flex gap-2"
                                                    >
                                                        <Input
                                                            value={option}
                                                            onChange={(event) =>
                                                                updateOption(
                                                                    index,
                                                                    optionIndex,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder={`Opsi ${optionIndex + 1}`}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                removeOption(
                                                                    index,
                                                                    optionIndex,
                                                                )
                                                            }
                                                        >
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </section>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeForm}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Task</DialogTitle>
                        <DialogDescription>
                            Task {deleteTarget?.name} akan dihapus permanen.
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function FilterSelect({
    label,
    value,
    onValueChange,
    items,
    includeAll = true,
}: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    items: TaskSelectOption[];
    includeAll?: boolean;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder={label} />
                </SelectTrigger>
                <SelectContent>
                    {includeAll && <SelectItem value="all">Semua</SelectItem>}
                    {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function FormSelect({
    label,
    value,
    onValueChange,
    items,
    placeholder,
    error,
}: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    items: TaskSelectOption[];
    placeholder?: string;
    error?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder ?? label} />
                </SelectTrigger>
                <SelectContent>
                    {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FieldError message={error} />
        </div>
    );
}
