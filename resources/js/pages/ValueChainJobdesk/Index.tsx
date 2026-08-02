import { Head, router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Eye,
    FileText,
    GitBranch,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import type { ElementType, FormEvent, ReactNode } from 'react';
import { Fragment, useMemo, useState } from 'react';
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
import { formatCurrency } from '@/lib/formatters';
import {
    destroy as destroyProfile,
    index as valueChainJobdeskIndex,
    store as storeProfile,
    update as updateProfile,
} from '@/routes/value-chain-jobdesk';
import type { OrganizationOption } from '@/types/ebitda';
import type {
    OrganizationProfileItem,
    OrganizationProfileSummary,
    ValueChainJobdeskFilters,
} from '@/types/value-chain-jobdesk';

type Props = {
    profiles: OrganizationProfileItem[];
    organizations: OrganizationOption[];
    summary: OrganizationProfileSummary;
    filters: ValueChainJobdeskFilters;
};

type ProfileTreeItem = OrganizationProfileItem & {
    children: ProfileTreeItem[];
};

type StatCardProps = {
    title: string;
    value: number;
    icon: ElementType;
};

type ProfileFormData = {
    organization_id: string;
    job_description: string;
    qualification: string;
    value_chain: string;
    method_cost: string;
    source_sheet: string;
};

const modeOptions: Array<{
    value: ValueChainJobdeskFilters['mode'];
    label: string;
}> = [
    { value: 'all', label: 'Semua Data' },
    { value: 'value_chain', label: 'Value Chain' },
    { value: 'jobdesk', label: 'Jobdesk' },
];

function createDefaultForm(): ProfileFormData {
    return {
        organization_id: '',
        job_description: '',
        qualification: '',
        value_chain: '',
        method_cost: '',
        source_sheet: 'Manual CRUD',
    };
}

function toFormData(profile: OrganizationProfileItem): ProfileFormData {
    return {
        organization_id: String(profile.organization_id),
        job_description: profile.job_description ?? '',
        qualification: profile.qualification ?? '',
        value_chain: profile.value_chain ?? '',
        method_cost:
            profile.method_cost === null ? '' : String(profile.method_cost),
        source_sheet: profile.source_sheet ?? 'Manual CRUD',
    };
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}

function TextAreaField({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
            <FieldError message={error} />
        </div>
    );
}

function truncateText(value: string | null, maxLength = 120) {
    if (!value) {
        return '-';
    }

    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength)}...`;
}

function formatMethodCost(value: number | null) {
    return value === null ? '-' : formatCurrency(value);
}

function buildProfileTree(profiles: OrganizationProfileItem[]) {
    const nodesByOrganizationId = new Map<number, ProfileTreeItem>();

    profiles.forEach((profile) => {
        nodesByOrganizationId.set(profile.organization_id, {
            ...profile,
            children: [],
        });
    });

    const roots: ProfileTreeItem[] = [];

    profiles.forEach((profile) => {
        const node = nodesByOrganizationId.get(profile.organization_id);

        if (!node) {
            return;
        }

        const parentId = profile.parent_id;

        if (parentId !== null && nodesByOrganizationId.has(parentId)) {
            nodesByOrganizationId.get(parentId)?.children.push(node);

            return;
        }

        roots.push(node);
    });

    return roots;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
    return (
        <Card className="rounded-lg border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-1 text-2xl font-semibold text-primary">
                        {value}
                    </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    <Icon className="size-5" />
                </div>
            </CardContent>
        </Card>
    );
}

function DetailBlock({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-lg border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <div className="mt-3 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                {children || '-'}
            </div>
        </section>
    );
}

function ProfileBadges({ profile }: { profile: OrganizationProfileItem }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
                {profile.code ?? '-'}
            </Badge>

            <Badge
                variant="outline"
                className="border-primary/25 bg-primary/5 text-primary"
            >
                {profile.level ?? '-'}
            </Badge>

            <Badge
                variant="secondary"
                className={
                    profile.is_revenue_center
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                }
            >
                {profile.is_revenue_center ? 'Revenue Center' : 'Cost Center'}
            </Badge>
        </div>
    );
}

function ProfileTreeRows({
    nodes,
    depth = 0,
    onSelectProfile,
    onEditProfile,
    onDeleteProfile,
}: {
    nodes: ProfileTreeItem[];
    depth?: number;
    onSelectProfile: (profile: OrganizationProfileItem) => void;
    onEditProfile: (profile: OrganizationProfileItem) => void;
    onDeleteProfile: (profile: OrganizationProfileItem) => void;
}) {
    const [openOrganizationId, setOpenOrganizationId] = useState<number | null>(
        depth === 0 && nodes.length > 0 ? nodes[0].organization_id : null,
    );

    return (
        <>
            {nodes.map((node) => {
                const isOpen = openOrganizationId === node.organization_id;

                return (
                    <Fragment key={node.organization_id}>
                        <ProfileTableRow
                            node={node}
                            depth={depth}
                            isOpen={isOpen}
                            onOpenChange={(open) =>
                                setOpenOrganizationId(
                                    open ? node.organization_id : null,
                                )
                            }
                            onSelectProfile={onSelectProfile}
                            onEditProfile={onEditProfile}
                            onDeleteProfile={onDeleteProfile}
                        />

                        {isOpen && node.children.length > 0 && (
                            <ProfileTreeRows
                                nodes={node.children}
                                depth={depth + 1}
                                onSelectProfile={onSelectProfile}
                                onEditProfile={onEditProfile}
                                onDeleteProfile={onDeleteProfile}
                            />
                        )}
                    </Fragment>
                );
            })}
        </>
    );
}

function ProfileTableRow({
    node,
    depth,
    isOpen,
    onOpenChange,
    onSelectProfile,
    onEditProfile,
    onDeleteProfile,
}: {
    node: ProfileTreeItem;
    depth: number;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectProfile: (profile: OrganizationProfileItem) => void;
    onEditProfile: (profile: OrganizationProfileItem) => void;
    onDeleteProfile: (profile: OrganizationProfileItem) => void;
}) {
    const hasChildren = node.children.length > 0;

    return (
        <tr className="border-b align-top transition-colors hover:bg-muted/30">
            <td className="p-4">
                <div
                    className="flex items-start gap-3"
                    style={{ paddingLeft: depth > 0 ? `${depth * 22}px` : 0 }}
                >
                    <button
                        type="button"
                        disabled={!hasChildren}
                        aria-expanded={hasChildren ? isOpen : undefined}
                        onClick={() => onOpenChange(!isOpen)}
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/15 disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground"
                    >
                        {hasChildren ? (
                            isOpen ? (
                                <ChevronDown className="size-4" />
                            ) : (
                                <ChevronRight className="size-4" />
                            )
                        ) : (
                            <span className="size-1.5 rounded-full bg-current" />
                        )}
                    </button>

                    <div className="min-w-0 flex-1">
                        <ProfileBadges profile={node} />

                        <div className="mt-2 font-medium text-foreground">
                            {node.name ?? '-'}
                        </div>

                        {node.directorate_group && (
                            <div className="mt-1 text-xs text-muted-foreground">
                                {node.directorate_group}
                            </div>
                        )}

                        {hasChildren && (
                            <div className="mt-1 text-xs text-muted-foreground">
                                {node.children.length} child
                            </div>
                        )}
                    </div>
                </div>
            </td>

            <td className="max-w-[260px] p-4 text-muted-foreground">
                {truncateText(node.value_chain, 140)}
            </td>

            <td className="max-w-[340px] p-4 text-muted-foreground">
                {truncateText(node.job_description, 180)}
            </td>

            <td className="p-4 text-right font-medium text-foreground">
                {formatMethodCost(node.method_cost)}
            </td>

            <td className="p-4">
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectProfile(node)}
                    >
                        <Eye className="size-4" />
                        Detail
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => onEditProfile(node)}
                    >
                        <Pencil className="size-4" />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteProfile(node)}
                    >
                        <Trash2 className="size-4" />
                        Hapus
                    </Button>
                </div>
            </td>
        </tr>
    );
}

function ProfileTreeMobileList({
    nodes,
    depth = 0,
    onSelectProfile,
    onEditProfile,
    onDeleteProfile,
}: {
    nodes: ProfileTreeItem[];
    depth?: number;
    onSelectProfile: (profile: OrganizationProfileItem) => void;
    onEditProfile: (profile: OrganizationProfileItem) => void;
    onDeleteProfile: (profile: OrganizationProfileItem) => void;
}) {
    const [openOrganizationId, setOpenOrganizationId] = useState<number | null>(
        depth === 0 && nodes.length > 0 ? nodes[0].organization_id : null,
    );

    return (
        <div className={depth === 0 ? 'space-y-3' : 'space-y-2'}>
            {nodes.map((node) => {
                const hasChildren = node.children.length > 0;
                const isOpen = openOrganizationId === node.organization_id;

                return (
                    <div
                        key={node.organization_id}
                        className="rounded-lg border bg-card p-4 shadow-sm"
                        style={{
                            marginLeft: depth > 0 ? `${depth * 14}px` : 0,
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <button
                                type="button"
                                disabled={!hasChildren}
                                aria-expanded={hasChildren ? isOpen : undefined}
                                onClick={() =>
                                    setOpenOrganizationId(
                                        isOpen ? null : node.organization_id,
                                    )
                                }
                                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/15 disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground"
                            >
                                {hasChildren ? (
                                    isOpen ? (
                                        <ChevronDown className="size-4" />
                                    ) : (
                                        <ChevronRight className="size-4" />
                                    )
                                ) : (
                                    <span className="size-1.5 rounded-full bg-current" />
                                )}
                            </button>

                            <div className="min-w-0 flex-1 space-y-3">
                                <ProfileBadges profile={node} />

                                <div>
                                    <h3 className="text-base leading-snug font-semibold text-foreground">
                                        {node.name ?? '-'}
                                    </h3>

                                    {node.directorate_group && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {node.directorate_group}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p className="text-muted-foreground">
                                        <span className="font-medium text-foreground">
                                            Value Chain:{' '}
                                        </span>
                                        {truncateText(node.value_chain, 100)}
                                    </p>

                                    <p className="text-muted-foreground">
                                        <span className="font-medium text-foreground">
                                            Jobdesk:{' '}
                                        </span>
                                        {truncateText(
                                            node.job_description,
                                            100,
                                        )}
                                    </p>

                                    <p className="font-medium text-foreground">
                                        {formatMethodCost(node.method_cost)}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onSelectProfile(node)}
                                    >
                                        <Eye className="size-4" />
                                        Detail
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => onEditProfile(node)}
                                    >
                                        <Pencil className="size-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => onDeleteProfile(node)}
                                    >
                                        <Trash2 className="size-4" />
                                        Hapus
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {isOpen && hasChildren && (
                            <div className="mt-3">
                                <ProfileTreeMobileList
                                    nodes={node.children}
                                    depth={depth + 1}
                                    onSelectProfile={onSelectProfile}
                                    onEditProfile={onEditProfile}
                                    onDeleteProfile={onDeleteProfile}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function ValueChainJobdeskIndex({
    profiles,
    organizations,
    summary,
    filters,
}: Props) {
    const [selectedProfile, setSelectedProfile] =
        useState<OrganizationProfileItem | null>(null);
    const [selectedItem, setSelectedItem] =
        useState<OrganizationProfileItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [form, setForm] = useState({
        search: filters.search ?? '',
        mode: filters.mode ?? 'all',
    });

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<ProfileFormData>(createDefaultForm());

    const profileTree = useMemo(() => buildProfileTree(profiles), [profiles]);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            valueChainJobdeskIndex.url(),
            {
                search: form.search,
                mode: form.mode,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const openCreateForm = () => {
        setSelectedItem(null);
        reset();
        clearErrors();
        setData(createDefaultForm());
        setIsFormOpen(true);
    };

    const openEditForm = (profile: OrganizationProfileItem) => {
        setSelectedItem(profile);
        clearErrors();
        setData(toFormData(profile));
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setSelectedItem(null);
        reset();
        clearErrors();
    };

    const submitProfile = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (selectedItem) {
            put(updateProfile.url(selectedItem.id), options);

            return;
        }

        post(storeProfile.url(), options);
    };

    const deleteProfile = (profile: OrganizationProfileItem) => {
        if (!confirm(`Yakin ingin menghapus profile ${profile.code ?? ''}?`)) {
            return;
        }

        router.delete(destroyProfile.url(profile.id), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Value Chain & Jobdesk" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                CRUD Value Chain & Jobdesk
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Value Chain & Jobdesk Organisasi
                            </h1>
                            <p className="mt-2 max-w-4xl text-muted-foreground">
                                Data dari worksheet ValueChain & JobDesc
                                disajikan dalam tabel hirarki organisasi.
                            </p>
                        </div>

                        <Button type="button" onClick={openCreateForm}>
                            <Plus className="size-4" />
                            Tambah Profile
                        </Button>
                    </section>

                    <section className="grid gap-4 md:grid-cols-4">
                        <StatCard
                            title="Total Profile"
                            value={summary.total_profiles}
                            icon={ClipboardList}
                        />
                        <StatCard
                            title="Dengan Jobdesk"
                            value={summary.with_jobdesk}
                            icon={BookOpen}
                        />
                        <StatCard
                            title="Dengan Value Chain"
                            value={summary.with_value_chain}
                            icon={GitBranch}
                        />
                        <StatCard
                            title="Total Organisasi"
                            value={summary.total_organizations}
                            icon={FileText}
                        />
                    </section>

                    <Card className="rounded-lg border bg-card shadow-sm">
                        <CardContent className="p-5">
                            <form
                                onSubmit={submit}
                                className="grid gap-4 md:grid-cols-[1fr_220px_auto]"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                                        <Input
                                            value={form.search}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    search: event.target.value,
                                                }))
                                            }
                                            placeholder="Cari kode, unit, jobdesk, atau value chain"
                                            className="h-10 pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Mode
                                    </label>
                                    <select
                                        value={form.mode}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                mode: event.target
                                                    .value as ValueChainJobdeskFilters['mode'],
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                    >
                                        {modeOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
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
                            <CardTitle className="text-foreground">
                                Data Value Chain & Jobdesk
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-0">
                            {profileTree.length > 0 ? (
                                <>
                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                                                    <th className="min-w-[320px] p-4">
                                                        Unit
                                                    </th>
                                                    <th className="min-w-[180px] p-4">
                                                        Value Chain
                                                    </th>
                                                    <th className="min-w-[260px] p-4">
                                                        Jobdesk
                                                    </th>
                                                    <th className="min-w-[150px] p-4 text-right">
                                                        Method Cost
                                                    </th>
                                                    <th className="w-[120px] p-4 text-right">
                                                        Aksi
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                <ProfileTreeRows
                                                    key={`${filters.search}-${filters.mode}-${profiles.length}`}
                                                    nodes={profileTree}
                                                    onSelectProfile={(
                                                        profile,
                                                    ) =>
                                                        setSelectedProfile(
                                                            profile,
                                                        )
                                                    }
                                                    onEditProfile={openEditForm}
                                                    onDeleteProfile={
                                                        deleteProfile
                                                    }
                                                />
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-4 md:hidden">
                                        <ProfileTreeMobileList
                                            key={`${filters.search}-${filters.mode}-${profiles.length}-mobile`}
                                            nodes={profileTree}
                                            onSelectProfile={(profile) =>
                                                setSelectedProfile(profile)
                                            }
                                            onEditProfile={openEditForm}
                                            onDeleteProfile={deleteProfile}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    Data tidak ditemukan. Silakan upload ulang
                                    file Excel melalui menu Import Excel.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <form onSubmit={submitProfile} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedItem
                                    ? 'Edit Profile Organisasi'
                                    : 'Tambah Profile Organisasi'}
                            </DialogTitle>
                            <DialogDescription>
                                Kelola value chain, jobdesk, qualification, dan
                                method cost untuk organisasi.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Organisasi</Label>
                                <select
                                    value={data.organization_id}
                                    onChange={(event) =>
                                        setData(
                                            'organization_id',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                                >
                                    <option value="">Pilih organisasi</option>
                                    {organizations.map((organization) => (
                                        <option
                                            key={organization.id}
                                            value={organization.id}
                                        >
                                            {organization.code} -{' '}
                                            {organization.name}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={errors.organization_id} />
                            </div>

                            <TextAreaField
                                label="Value Chain"
                                value={data.value_chain}
                                onChange={(value) =>
                                    setData('value_chain', value)
                                }
                                error={errors.value_chain}
                            />

                            <TextAreaField
                                label="Qualification"
                                value={data.qualification}
                                onChange={(value) =>
                                    setData('qualification', value)
                                }
                                error={errors.qualification}
                            />

                            <div className="space-y-2 md:col-span-2">
                                <TextAreaField
                                    label="Jobdesk"
                                    value={data.job_description}
                                    onChange={(value) =>
                                        setData('job_description', value)
                                    }
                                    error={errors.job_description}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Method Cost</Label>
                                <Input
                                    type="number"
                                    value={data.method_cost}
                                    onChange={(event) =>
                                        setData(
                                            'method_cost',
                                            event.target.value,
                                        )
                                    }
                                />
                                <FieldError message={errors.method_cost} />
                            </div>

                            <div className="space-y-2">
                                <Label>Source Sheet</Label>
                                <Input
                                    value={data.source_sheet}
                                    onChange={(event) =>
                                        setData(
                                            'source_sheet',
                                            event.target.value,
                                        )
                                    }
                                />
                                <FieldError message={errors.source_sheet} />
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
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={selectedProfile !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedProfile(null);
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
                    {selectedProfile && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-foreground">
                                    Detail Value Chain & Jobdesk
                                </DialogTitle>
                                <DialogDescription>
                                    Data lengkap dari baris tabel yang dipilih.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5">
                                <section className="rounded-lg border bg-card p-4">
                                    <ProfileBadges profile={selectedProfile} />

                                    <h2 className="mt-3 text-xl font-semibold text-foreground">
                                        {selectedProfile.name ?? '-'}
                                    </h2>

                                    <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                                        <p>
                                            Source:{' '}
                                            {selectedProfile.source_sheet ??
                                                '-'}
                                        </p>
                                        <p>
                                            Method Cost:{' '}
                                            <span className="font-medium text-foreground">
                                                {formatMethodCost(
                                                    selectedProfile.method_cost,
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </section>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <DetailBlock title="Value Chain">
                                        {selectedProfile.value_chain}
                                    </DetailBlock>

                                    <DetailBlock title="Kualifikasi / Kompetensi">
                                        {selectedProfile.qualification}
                                    </DetailBlock>
                                </div>

                                <DetailBlock title="Jobdesk / Tugas dan Tanggung Jawab">
                                    {selectedProfile.job_description}
                                </DetailBlock>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

ValueChainJobdeskIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Value Chain & Jobdesk',
            href: valueChainJobdeskIndex(),
        },
    ],
};
