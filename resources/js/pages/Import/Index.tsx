import { Head, useForm } from '@inertiajs/react';
import { UploadCloud } from 'lucide-react';
import { useEffect } from 'react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    index as importExcelIndex,
    store as storeImport,
} from '@/routes/import-excel';

type ExcelImport = {
    id: number;
    original_filename: string;
    status: string;
    total_rows: number;
    success_rows: number;
    failed_rows: number;
    created_at: string;
    errors?: ImportErrorLog[];
};

type ImportErrorLog = {
    id: number;
    row_number: number | null;
    sheet_name: string | null;
    message: string;
    payload: Record<string, unknown> | null;
    created_at: string;
};

type Props = {
    imports: ExcelImport[];
};

export default function ImportIndex({ imports }: Props) {
    const { data, setData, post, processing, errors, progress, reset } =
        useForm<{
            file: File | null;
            year: number;
        }>({
            file: null,
            year: new Date().getFullYear(),
        });

    useEffect(() => {
        const importsWithErrors = imports.filter(
            (item) =>
                ['failed', 'completed_with_errors'].includes(item.status) ||
                (item.errors?.length ?? 0) > 0,
        );

        if (importsWithErrors.length === 0) {
            return;
        }

        console.groupCollapsed(
            `[EBITDAMAX Import] ${importsWithErrors.length} import memiliki error`,
        );

        importsWithErrors.forEach((item) => {
            console.groupCollapsed(
                `[Import #${item.id}] ${item.original_filename} - ${item.status}`,
            );
            console.error('[EBITDAMAX Import] Ringkasan', {
                id: item.id,
                file: item.original_filename,
                status: item.status,
                successRows: item.success_rows,
                failedRows: item.failed_rows,
                totalRows: item.total_rows,
                createdAt: item.created_at,
            });

            if ((item.errors?.length ?? 0) > 0) {
                console.table(
                    item.errors?.map((error) => ({
                        id: error.id,
                        sheet: error.sheet_name ?? '-',
                        row: error.row_number ?? '-',
                        message: error.message,
                        createdAt: error.created_at,
                    })),
                );

                item.errors?.forEach((error) => {
                    if (error.payload) {
                        console.log(
                            `[Import Error #${error.id}] payload`,
                            error.payload,
                        );
                    }
                });
            } else {
                console.warn(
                    '[EBITDAMAX Import] Tidak ada detail error log untuk import ini.',
                );
            }

            console.groupEnd();
        });

        console.groupEnd();
    }, [imports]);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        post(storeImport.url(), {
            forceFormData: true,
            onSuccess: () => reset('file'),
            onError: (formErrors) => {
                console.error(
                    '[EBITDAMAX Import] Upload/import gagal sebelum selesai diproses',
                    formErrors,
                );
            },
        });
    };

    return (
        <>
            <Head title="Import Excel" />

            <div className="min-h-screen bg-gradient-to-b from-red-50/70 via-white to-white">
                <div className="space-y-6 p-6">
                    <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium tracking-wide text-red-600 uppercase">
                            Sprint 3 — Excel Import Engine
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-950">
                            Import Excel Dashboard Pohon EBITDA
                        </h1>
                        <p className="mt-2 max-w-3xl text-muted-foreground">
                            Upload file Excel EBITDAMAX untuk membaca nilai
                            Revenue, DOC-V, DOC-F, IOC, TOC, EBITDA, dan EBITDA
                            Margin per unit organisasi.
                        </p>
                    </div>

                    <Card className="border-red-100 bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <UploadCloud className="h-5 w-5" />
                                Upload File Excel
                            </CardTitle>
                            <CardDescription>
                                Gunakan file .xlsx dari worksheet Dashboard
                                Pohon EBITDA.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={submit} className="space-y-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Tahun</Label>
                                        <Input
                                            type="number"
                                            value={data.year}
                                            onChange={(event) =>
                                                setData(
                                                    'year',
                                                    Number(event.target.value),
                                                )
                                            }
                                            className="border-red-100 focus-visible:ring-red-600"
                                        />
                                        {errors.year && (
                                            <p className="text-sm text-red-600">
                                                {errors.year}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>File Excel</Label>
                                        <Input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={(event) => {
                                                setData(
                                                    'file',
                                                    event.target.files?.[0] ??
                                                        null,
                                                );
                                            }}
                                            className="border-red-100 focus-visible:ring-red-600"
                                        />
                                        {errors.file && (
                                            <p className="text-sm text-red-600">
                                                {errors.file}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {progress && (
                                    <div className="h-2 overflow-hidden rounded-full bg-red-100">
                                        <div
                                            className="h-full bg-red-600 transition-all"
                                            style={{
                                                width: `${progress.percentage ?? 0}%`,
                                            }}
                                        />
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={processing || !data.file}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                >
                                    {processing
                                        ? 'Memproses...'
                                        : 'Import Excel'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-red-100 bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-red-700">
                                Riwayat Import
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-red-100 text-left">
                                            <th className="p-3">File</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Success</th>
                                            <th className="p-3">Failed</th>
                                            <th className="p-3">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {imports.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-red-50"
                                            >
                                                <td className="p-3 font-medium">
                                                    {item.original_filename}
                                                </td>
                                                <td className="p-3">
                                                    <Badge className="bg-red-600 text-white">
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    {item.success_rows}
                                                </td>
                                                <td className="p-3">
                                                    {item.failed_rows}
                                                </td>
                                                <td className="p-3">
                                                    {item.total_rows}
                                                </td>
                                            </tr>
                                        ))}

                                        {imports.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="p-6 text-center text-muted-foreground"
                                                >
                                                    Belum ada riwayat import.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ImportIndex.layout = {
    breadcrumbs: [
        {
            title: 'Import Excel',
            href: importExcelIndex(),
        },
    ],
};
