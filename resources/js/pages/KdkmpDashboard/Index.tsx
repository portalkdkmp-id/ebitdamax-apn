import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    Clock3,
    MapPin,
    Save,
    Store,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import InputError from '@/components/input-error';
import { kdkmpManualFields } from '@/lib/kdkmp-dashboard-fields';
import { upsert } from '@/routes/kdkmp-dashboard';
import type {
    KdkmpDailyEntry,
    KdkmpManagerDashboardProps,
    KdkmpManualFields,
} from '@/types/kdkmp-dashboard';

type DailyForm = {
    [Field in keyof KdkmpManualFields]: string;
};

function inputValue(value: string | null | undefined): string {
    return value ?? '';
}

function formatRupiahInput(value: string): string {
    if (value === '') {
        return '';
    }

    if (value === '-') {
        return '-';
    }

    const isNegative = value.startsWith('-');
    const [integerPart, decimalPart] = value.replace(/^-/, '').split('.');
    const integerDigits = integerPart.replace(/\D/g, '') || '0';
    const formattedInteger = integerDigits.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        '.',
    );

    const formattedValue =
        decimalPart === undefined
            ? formattedInteger
            : `${formattedInteger},${decimalPart.slice(0, 2)}`;

    return isNegative ? `-${formattedValue}` : formattedValue;
}

function parseRupiahInput(value: string): string {
    const isNegative = value.trimStart().startsWith('-');
    const sanitized = value.replace(/[^\d,.]/g, '').replaceAll('.', '');
    const [integerPart, ...decimalParts] = sanitized.split(',');
    const integerDigits = integerPart
        .replace(/\D/g, '')
        .replace(/^0+(?=\d)/, '');
    const decimalDigits = decimalParts.join('').replace(/\D/g, '').slice(0, 2);

    if (integerDigits === '' && decimalDigits === '') {
        return isNegative ? '-' : '';
    }

    const prefix = isNegative ? '-' : '';

    if (sanitized.includes(',')) {
        return `${prefix}${integerDigits || '0'}.${decimalDigits}`;
    }

    return `${prefix}${integerDigits}`;
}

function RupiahInput({
    id,
    value,
    onValueChange,
}: {
    id: string;
    value: string;
    onValueChange: (value: string) => void;
}) {
    return (
        <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
            </span>
            <Input
                id={id}
                type="text"
                inputMode="decimal"
                value={formatRupiahInput(value)}
                onChange={(event) =>
                    onValueChange(parseRupiahInput(event.target.value))
                }
                className="pl-10"
                placeholder="0"
            />
        </div>
    );
}

function formDataFrom(entry: KdkmpDailyEntry | null): DailyForm {
    return {
        target_revenue: inputValue(entry?.target_revenue),
        plan_revenue: inputValue(entry?.plan_revenue),
        actual_revenue: inputValue(entry?.actual_revenue),
        target_cost: inputValue(entry?.target_cost),
        plan_cost: inputValue(entry?.plan_cost),
        actual_cost: inputValue(entry?.actual_cost),
        target_ebitda: inputValue(entry?.target_ebitda),
        plan_ebitda: inputValue(entry?.plan_ebitda),
        actual_ebitda: inputValue(entry?.actual_ebitda),
        target_ebitda_margin: inputValue(entry?.target_ebitda_margin),
        actual_ebitda_margin: inputValue(entry?.actual_ebitda_margin),
        total_duration: inputValue(entry?.total_duration),
        performance_scoring: inputValue(entry?.performance_scoring),
    };
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function formatManualValue(value: string | null, isRupiah: boolean): string {
    if (value === null || value.trim() === '') {
        return '-';
    }

    if (!isRupiah || !/^-?\d+(\.\d{0,2})?$/.test(value)) {
        return value;
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 2,
    }).format(Number(value));
}

function EntryStatus({ entry }: { entry: KdkmpDailyEntry | null }) {
    if (!entry) {
        return <Badge variant="outline">Belum diisi</Badge>;
    }

    return entry.is_complete ? (
        <Badge className="bg-emerald-600 text-white">Lengkap</Badge>
    ) : (
        <Badge className="bg-amber-500 text-white">Draft</Badge>
    );
}

export default function KdkmpDashboardIndex({
    businessDate,
    kdkmp,
    todayEntry,
    history,
}: KdkmpManagerDashboardProps) {
    const { data, setData, put, processing, errors } = useForm<DailyForm>(
        formDataFrom(todayEntry),
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(upsert.url(), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Dashboard KDKMP" />

            <div className="min-h-screen bg-background p-4 sm:p-6">
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-sm font-medium tracking-wide text-primary uppercase">
                            Laporan Harian
                        </p>
                        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    Dashboard EBITDAMAX KDKMP
                                </h1>
                                <p className="mt-2 text-muted-foreground">
                                    Isi pencapaian harian KDKMP. Data dapat
                                    disimpan bertahap sebagai draft.
                                </p>
                            </div>
                            <EntryStatus entry={todayEntry} />
                        </div>
                    </div>

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

                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle>Input Data Hari Ini</CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <form
                                        onSubmit={submit}
                                        className="space-y-6"
                                    >
                                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                            {kdkmpManualFields.map((field) => (
                                                <div
                                                    key={field.key}
                                                    className="space-y-2"
                                                >
                                                    <Label htmlFor={field.key}>
                                                        {field.label}
                                                    </Label>
                                                    {field.isRupiah ? (
                                                        <RupiahInput
                                                            id={field.key}
                                                            value={
                                                                data[field.key]
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                setData(
                                                                    field.key,
                                                                    value,
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        <Input
                                                            id={field.key}
                                                            type="text"
                                                            value={
                                                                data[field.key]
                                                            }
                                                            onChange={(event) =>
                                                                setData(
                                                                    field.key,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder={
                                                                field.placeholder
                                                            }
                                                        />
                                                    )}
                                                    <InputError
                                                        message={
                                                            errors[field.key]
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Kolom yang belum tersedia boleh
                                                dikosongkan dan disimpan sebagai
                                                draft.
                                            </p>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                <Save className="size-4" />
                                                {processing
                                                    ? 'Menyimpan...'
                                                    : 'Simpan Data Hari Ini'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Clock3 className="size-5" />
                                Riwayat Harian
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-5">
                            <div className="overflow-x-auto">
                                <Table className="min-w-[2700px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            {kdkmpManualFields.map((field) => (
                                                <TableHead key={field.key}>
                                                    {field.label}
                                                </TableHead>
                                            ))}
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.data.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={
                                                        kdkmpManualFields.length +
                                                        2
                                                    }
                                                    className="py-8 text-center text-muted-foreground"
                                                >
                                                    Belum ada riwayat laporan
                                                    harian.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {history.data.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="font-medium">
                                                    {formatDate(
                                                        entry.report_date,
                                                    )}
                                                </TableCell>
                                                {kdkmpManualFields.map(
                                                    (field) => (
                                                        <TableCell
                                                            key={field.key}
                                                            className="tabular-nums"
                                                        >
                                                            {formatManualValue(
                                                                entry[
                                                                    field.key
                                                                ],
                                                                field.isRupiah ===
                                                                    true,
                                                            )}
                                                        </TableCell>
                                                    ),
                                                )}
                                                <TableCell>
                                                    <EntryStatus
                                                        entry={entry}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {history.last_page > 1 && (
                                <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                    <p>
                                        Menampilkan {history.from ?? 0}-
                                        {history.to ?? 0} dari {history.total}{' '}
                                        riwayat
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {history.links.map((link) => (
                                            <Button
                                                key={`${link.label}-${link.url}`}
                                                type="button"
                                                size="sm"
                                                variant={
                                                    link.active
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                disabled={!link.url}
                                                onClick={() => {
                                                    if (link.url) {
                                                        router.get(
                                                            link.url,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                            },
                                                        );
                                                    }
                                                }}
                                            >
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
