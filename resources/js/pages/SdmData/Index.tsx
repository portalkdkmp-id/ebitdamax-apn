import { Head, router } from '@inertiajs/react';
import { Plus, Save, Search, Trash2, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    destroy,
    index as sdmDataIndex,
    store,
    update,
} from '@/routes/sdm-data';
import type { SdmDataPageProps, SdmEntry } from '@/types/monitoring';

function SdmRow({ entry }: { entry: SdmEntry }) {
    const [jumlahKaryawan, setJumlahKaryawan] = useState(
        String(entry.jumlah_karyawan),
    );
    const [saving, setSaving] = useState(false);
    const dirty = jumlahKaryawan !== String(entry.jumlah_karyawan);

    const save = () => {
        setSaving(true);
        router.put(
            update.url(entry.id),
            {
                nama_koperasi: entry.nama_koperasi,
                jumlah_karyawan: jumlahKaryawan,
                catatan: entry.catatan ?? '',
            },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    const remove = () => {
        if (!confirm(`Hapus data SDM untuk ${entry.nama_koperasi}?`)) {
            return;
        }

        router.delete(destroy.url(entry.id), { preserveScroll: true });
    };

    return (
        <TableRow>
            <TableCell className="font-medium">{entry.nama_koperasi}</TableCell>
            <TableCell className="w-40">
                <Input
                    type="number"
                    min={0}
                    value={jumlahKaryawan}
                    onChange={(e) => setJumlahKaryawan(e.target.value)}
                    className="text-right"
                />
            </TableCell>
            <TableCell className="w-40 text-right">
                <div className="flex justify-end gap-1">
                    <Button
                        size="sm"
                        variant={dirty ? 'default' : 'outline'}
                        disabled={!dirty || saving}
                        onClick={save}
                    >
                        <Save className="mr-1 h-4 w-4" />
                        Simpan
                    </Button>
                    <Button size="icon" variant="ghost" onClick={remove}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

function AddSdmRow() {
    const [namaKoperasi, setNamaKoperasi] = useState('');
    const [jumlahKaryawan, setJumlahKaryawan] = useState('0');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError(null);

        router.post(
            store.url(),
            { nama_koperasi: namaKoperasi, jumlah_karyawan: jumlahKaryawan },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNamaKoperasi('');
                    setJumlahKaryawan('0');
                },
                onError: (errors) => setError(errors.nama_koperasi ?? null),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <form onSubmit={submit} className="flex flex-wrap items-start gap-3">
            <div className="min-w-[220px] flex-1">
                <Input
                    value={namaKoperasi}
                    onChange={(e) => setNamaKoperasi(e.target.value)}
                    placeholder="Nama koperasi baru"
                    required
                />
                {error && (
                    <p className="mt-1 text-sm text-destructive">{error}</p>
                )}
            </div>
            <Input
                type="number"
                min={0}
                value={jumlahKaryawan}
                onChange={(e) => setJumlahKaryawan(e.target.value)}
                className="w-40"
                required
            />
            <Button type="submit" disabled={saving}>
                <Plus className="mr-1 h-4 w-4" />
                Tambah
            </Button>
        </form>
    );
}

export default function SdmDataIndex({
    entries,
    summary,
    filters,
}: SdmDataPageProps) {
    const [search, setSearch] = useState(filters.search);

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(sdmDataIndex.url(), { search }, { preserveState: true });
    };

    return (
        <>
            <Head title="Data SDM KDKMP" />

            <div className="min-h-screen bg-background">
                <div className="space-y-6 p-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-sm font-medium tracking-wide text-primary uppercase">
                            Input Tim HC
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-foreground">
                            Data SDM KDKMP
                        </h1>
                        <p className="mt-2 max-w-4xl text-muted-foreground">
                            Jumlah karyawan yang sudah ditambahkan dan
                            ditempatkan per KDKMP. Data diinput manual oleh tim
                            HC.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardContent className="flex items-center justify-between p-5">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        KDKMP Sudah Ditambahkan Karyawan
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">
                                        {summary.jumlah_kdkmp_ditambahkan.toLocaleString(
                                            'id-ID',
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
                                    <Users className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center justify-between p-5">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Karyawan Ditempatkan
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">
                                        {summary.total_karyawan.toLocaleString(
                                            'id-ID',
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-full bg-primary/10 p-3 text-primary">
                                    <Users className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardContent className="space-y-4 p-5">
                            <form
                                onSubmit={submitSearch}
                                className="flex max-w-sm items-center gap-2"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari nama koperasi..."
                                        className="pl-8"
                                    />
                                </div>
                                <Button type="submit" variant="outline">
                                    Cari
                                </Button>
                            </form>

                            <AddSdmRow />

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Koperasi</TableHead>
                                        <TableHead>Jumlah Karyawan</TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                className="text-center text-muted-foreground"
                                            >
                                                Belum ada data.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {entries.map((entry) => (
                                        <SdmRow key={entry.id} entry={entry} />
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

SdmDataIndex.layout = {
    surface: 'financial-light',
    breadcrumbs: [
        {
            title: 'Data SDM',
            href: sdmDataIndex(),
        },
    ],
};
