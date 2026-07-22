import { Head, router, useForm } from '@inertiajs/react';
import { BriefcaseBusiness, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
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
    destroy as destroyRole,
    index as rolesIndex,
    store as storeRole,
    update as updateRole,
} from '@/routes/roles';
import type {
    RoleFilters,
    RoleItem,
    RoleOption,
    RolePaginatedResponse,
} from '@/types/role';

type Props = {
    roles: RolePaginatedResponse;
    levelOptions: RoleOption[];
    filters: RoleFilters;
};

type RoleFormData = {
    name: string;
    level: string;
};

const defaultForm: RoleFormData = {
    name: '',
    level: 'staff',
};

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}

function levelVariant(
    level: RoleItem['level'],
): 'default' | 'secondary' | 'outline' {
    if (level === 'superadmin') {
        return 'default';
    }

    if (level === 'manager') {
        return 'secondary';
    }

    return 'outline';
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

export default function RolesIndex({ roles, levelOptions, filters }: Props) {
    const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterForm, setFilterForm] = useState({
        search: filters.search ?? '',
        sort: filters.sort ?? 'name',
        direction: filters.direction ?? 'asc',
    });

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<RoleFormData>(defaultForm);

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(rolesIndex.url(), filterForm, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openCreateForm = () => {
        setSelectedRole(null);
        clearErrors();
        reset();
        setData(defaultForm);
        setIsFormOpen(true);
    };

    const openEditForm = (role: RoleItem) => {
        setSelectedRole(role);
        clearErrors();
        setData({
            name: role.name,
            level: role.level,
        });
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setSelectedRole(null);
        reset();
        clearErrors();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (selectedRole) {
            put(updateRole.url(selectedRole.slug), options);

            return;
        }

        post(storeRole.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(destroyRole.url(deleteTarget.slug), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <>
            <Head title="Roles" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                Master Data
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Roles
                            </h1>
                            <p className="mt-2 max-w-3xl text-muted-foreground">
                                Kelola jabatan atau posisi kerja yang akan
                                digunakan sebagai PIC task.
                            </p>
                        </div>

                        <Button type="button" onClick={openCreateForm}>
                            <Plus className="size-4" />
                            Tambah Role
                        </Button>
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardContent className="p-5">
                            <form
                                onSubmit={submitFilters}
                                className="grid gap-4 lg:grid-cols-[1fr_180px_160px_auto]"
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
                                            placeholder="Cari nama, slug, atau level"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Sorting</Label>
                                    <Select
                                        value={filterForm.sort}
                                        onValueChange={(value) =>
                                            setFilterForm((current) => ({
                                                ...current,
                                                sort: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sorting" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name">
                                                Nama
                                            </SelectItem>
                                            <SelectItem value="level">
                                                Level
                                            </SelectItem>
                                            <SelectItem value="created_at">
                                                Dibuat
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Arah</Label>
                                    <Select
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
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Arah" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="asc">
                                                Ascending
                                            </SelectItem>
                                            <SelectItem value="desc">
                                                Descending
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

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
                                <CardTitle>Data Role</CardTitle>
                                <Badge variant="outline">
                                    {roles.total} role
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="min-w-[260px] p-4">
                                            Nama Role
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Level
                                        </TableHead>
                                        <TableHead className="p-4 text-right">
                                            User
                                        </TableHead>
                                        <TableHead className="w-[180px] p-4 text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Data role belum tersedia.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {roles.data.map((role) => (
                                        <TableRow key={role.uuid}>
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <BriefcaseBusiness className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {role.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {role.slug}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <Badge
                                                    variant={levelVariant(
                                                        role.level,
                                                    )}
                                                >
                                                    {role.level_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-4 text-right">
                                                {role.users_count}
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditForm(role)
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
                                                                role,
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

                    {roles.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {roles.from ?? 0}-{roles.to ?? 0}{' '}
                                dari {roles.total} role
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {roles.links.map((link) => (
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
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={submit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedRole ? 'Edit Role' : 'Tambah Role'}
                            </DialogTitle>
                            <DialogDescription>
                                Lengkapi nama dan level role.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <Label>Nama Role</Label>
                            <Input
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                placeholder="Contoh: Supervisor Gudang"
                            />
                            <FieldError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label>Level</Label>
                            <Select
                                value={data.level}
                                onValueChange={(value) =>
                                    setData('level', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {levelOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.level} />
                        </div>

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
                        <DialogTitle>Hapus Role</DialogTitle>
                        <DialogDescription>
                            Role {deleteTarget?.name} akan dihapus permanen.
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
