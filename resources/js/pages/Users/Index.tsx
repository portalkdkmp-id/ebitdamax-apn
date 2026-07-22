import { Head, router, useForm } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    Mail,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';
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
    destroy as destroyUser,
    index as usersIndex,
    store as storeUser,
    update as updateUser,
} from '@/routes/users';
import type {
    UserFilters,
    UserItem,
    UserPaginatedResponse,
    UserRole,
} from '@/types/user';

type Props = {
    users: UserPaginatedResponse;
    roles: UserRole[];
    filters: UserFilters;
};

type UserFormData = {
    role_id: string;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

const defaultForm: UserFormData = {
    role_id: '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
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

export default function UsersIndex({ users, roles, filters }: Props) {
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [detailUser, setDetailUser] = useState<UserItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);
    const [filterForm, setFilterForm] = useState({
        search: filters.search ?? '',
        role_id: filters.role_id ? String(filters.role_id) : 'all',
        sort: filters.sort ?? 'name',
        direction: filters.direction ?? 'asc',
    });

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<UserFormData>(defaultForm);

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            usersIndex.url(),
            {
                search: filterForm.search,
                role_id:
                    filterForm.role_id === 'all'
                        ? undefined
                        : filterForm.role_id,
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
        setSelectedUser(null);
        clearErrors();
        reset();
        setData(defaultForm);
        setShowPassword(false);
        setShowPasswordConfirmation(false);
        setIsFormOpen(true);
    };

    const openEditForm = (user: UserItem) => {
        setSelectedUser(user);
        clearErrors();
        setData({
            role_id: user.role_id ? String(user.role_id) : '',
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
        });
        setShowPassword(false);
        setShowPasswordConfirmation(false);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setSelectedUser(null);
        reset();
        clearErrors();
        setShowPassword(false);
        setShowPasswordConfirmation(false);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (selectedUser) {
            put(
                updateUser.url(
                    selectedUser.username ?? String(selectedUser.id),
                ),
                options,
            );

            return;
        }

        post(storeUser.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(
            destroyUser.url(deleteTarget.username ?? String(deleteTarget.id)),
            {
                preserveScroll: true,
                onSuccess: () => setDeleteTarget(null),
            },
        );
    };

    return (
        <>
            <Head title="Users" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                Master Data
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Users
                            </h1>
                            <p className="mt-2 max-w-3xl text-muted-foreground">
                                Kelola user aplikasi, username otomatis, dan
                                role yang digunakan untuk assignment task.
                            </p>
                        </div>

                        <Button type="button" onClick={openCreateForm}>
                            <Plus className="size-4" />
                            Tambah User
                        </Button>
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardContent className="p-5">
                            <form
                                onSubmit={submitFilters}
                                className="grid gap-4 lg:grid-cols-[1fr_220px_160px_160px_auto]"
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
                                            placeholder="Cari nama, username, atau email"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={filterForm.role_id}
                                        onValueChange={(value) =>
                                            setFilterForm((current) => ({
                                                ...current,
                                                role_id: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Role
                                            </SelectItem>
                                            {roles.map((role) => (
                                                <SelectItem
                                                    key={role.id}
                                                    value={String(role.id)}
                                                >
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                            <SelectItem value="email">
                                                Email
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
                                <CardTitle>Data User</CardTitle>
                                <Badge variant="outline">
                                    {users.total} user
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="min-w-[280px] p-4">
                                            User
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Role
                                        </TableHead>
                                        <TableHead className="p-4">
                                            Email
                                        </TableHead>
                                        <TableHead className="w-[260px] p-4 text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Data user belum tersedia.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {users.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <UserRound className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {user.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                {user.role ? (
                                                    <div className="space-y-1">
                                                        <Badge>
                                                            {user.role.name}
                                                        </Badge>
                                                        <p className="text-xs text-muted-foreground">
                                                            {
                                                                user.role
                                                                    .level_label
                                                            }
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline">
                                                        Tanpa Role
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="size-4" />
                                                    {user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDetailUser(user)
                                                        }
                                                    >
                                                        <Eye className="size-4" />
                                                        Detail
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditForm(user)
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
                                                                user,
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

                    {users.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {users.from ?? 0}-{users.to ?? 0}{' '}
                                dari {users.total} user
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {users.links.map((link) => (
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
                <DialogContent className="sm:max-w-xl">
                    <form onSubmit={submit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedUser ? 'Edit User' : 'Tambah User'}
                            </DialogTitle>
                            <DialogDescription>
                                Username dibuat otomatis dari nama user.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                value={data.role_id}
                                onValueChange={(value) =>
                                    setData('role_id', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(role.id)}
                                        >
                                            {role.name} - {role.level_label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.role_id} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Nama</Label>
                                <Input
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                    placeholder="Nama user"
                                />
                                <FieldError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                    placeholder="user@example.com"
                                />
                                <FieldError message={errors.email} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>
                                    Password
                                    {selectedUser && (
                                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                                            optional
                                        </span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={data.password}
                                        onChange={(event) =>
                                            setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Password"
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-0 right-0 h-9 w-9"
                                        onClick={() =>
                                            setShowPassword(
                                                (current) => !current,
                                            )
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </Button>
                                </div>
                                <FieldError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <Label>Konfirmasi Password</Label>
                                <div className="relative">
                                    <Input
                                        type={
                                            showPasswordConfirmation
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={data.password_confirmation}
                                        onChange={(event) =>
                                            setData(
                                                'password_confirmation',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Konfirmasi password"
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-0 right-0 h-9 w-9"
                                        onClick={() =>
                                            setShowPasswordConfirmation(
                                                (current) => !current,
                                            )
                                        }
                                    >
                                        {showPasswordConfirmation ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
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
                open={detailUser !== null}
                onOpenChange={(open) => !open && setDetailUser(null)}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detail User</DialogTitle>
                        <DialogDescription>
                            Informasi akun dan role user.
                        </DialogDescription>
                    </DialogHeader>
                    {detailUser && (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-background p-4">
                                <p className="text-sm text-muted-foreground">
                                    Nama
                                </p>
                                <p className="mt-1 font-semibold">
                                    {detailUser.name}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {detailUser.username}
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border bg-background p-4">
                                    <p className="text-sm text-muted-foreground">
                                        Email
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        {detailUser.email}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-background p-4">
                                    <p className="text-sm text-muted-foreground">
                                        Role
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-primary" />
                                        <p className="font-semibold">
                                            {detailUser.role?.name ?? '-'}
                                        </p>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {detailUser.role?.level_label ?? '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus User</DialogTitle>
                        <DialogDescription>
                            User {deleteTarget?.name} akan dihapus permanen.
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
