import { Head, useForm } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CircleUserRound,
    Fish,
    Leaf,
    Pencil,
    Plus,
    ShoppingBag,
    Smile,
    UserRound,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    store as storeCustomerAnalysis,
    update as updateCustomerAnalysis,
} from '@/routes/customer-analyses';
import type {
    CustomerAnalysisItem,
    CustomerAnalysisOption,
    CustomerAnalysisSentimentOption,
} from '@/types/customer-analysis';

type Props = {
    customerAnalyses: CustomerAnalysisItem[];
    occupationOptions: CustomerAnalysisOption[];
    sentimentOptions: CustomerAnalysisSentimentOption[];
};

type CustomerAnalysisFormData = {
    full_name: string;
    occupation_role: string;
    occupation_other: string;
    age: string;
    gender: string;
    interview_purpose: string;
    summary: string;
    sentiment: number;
};

const defaultForm: CustomerAnalysisFormData = {
    full_name: '',
    occupation_role: '',
    occupation_other: '',
    age: '',
    gender: '',
    interview_purpose: '',
    summary: '',
    sentiment: 3,
};

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}

function PersonaIllustration({ occupationRole }: { occupationRole: string }) {
    const illustration = {
        farmer: {
            icon: Leaf,
            className: 'from-emerald-500 to-lime-400',
        },
        fisher: {
            icon: Fish,
            className: 'from-sky-500 to-cyan-400',
        },
        retail_customer: {
            icon: ShoppingBag,
            className: 'from-violet-500 to-fuchsia-400',
        },
        umkm_owner: {
            icon: BriefcaseBusiness,
            className: 'from-amber-500 to-orange-400',
        },
        other: {
            icon: Users,
            className: 'from-slate-500 to-slate-400',
        },
    }[occupationRole] ?? {
        icon: UserRound,
        className: 'from-slate-500 to-slate-400',
    };
    const Icon = illustration.icon;

    return (
        <div
            className={`flex h-28 items-center justify-center bg-linear-to-br ${illustration.className}`}
        >
            <Icon className="size-12 text-white/95" strokeWidth={1.6} />
        </div>
    );
}

function sentimentBadgeClass(sentiment: number): string {
    if (sentiment <= 2) {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    if (sentiment >= 4) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    return 'border-slate-200 bg-slate-50 text-slate-700';
}

export default function CustomerAnalysisIndex({
    customerAnalyses,
    occupationOptions,
    sentimentOptions,
}: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] =
        useState<CustomerAnalysisItem | null>(null);
    const [detailTarget, setDetailTarget] =
        useState<CustomerAnalysisItem | null>(null);
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<CustomerAnalysisFormData>(defaultForm);

    const currentSentiment = useMemo(
        () =>
            sentimentOptions.find(
                (option) => option.value === data.sentiment,
            ) ?? sentimentOptions[2],
        [data.sentiment, sentimentOptions],
    );

    const openCreateForm = () => {
        setSelectedAnalysis(null);
        clearErrors();
        reset();
        setData(defaultForm);
        setIsFormOpen(true);
    };

    const openEditForm = (analysis: CustomerAnalysisItem) => {
        setDetailTarget(null);
        setSelectedAnalysis(analysis);
        clearErrors();
        setData({
            full_name: analysis.full_name,
            occupation_role: analysis.occupation_role,
            occupation_other: analysis.occupation_other ?? '',
            age: String(analysis.age),
            gender: analysis.gender,
            interview_purpose: analysis.interview_purpose,
            summary: analysis.summary,
            sentiment: analysis.sentiment,
        });
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setSelectedAnalysis(null);
        clearErrors();
        reset();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (selectedAnalysis) {
            put(updateCustomerAnalysis.url(selectedAnalysis.id), options);

            return;
        }

        post(storeCustomerAnalysis.url(), options);
    };

    return (
        <>
            <Head title="Customer Analysis" />

            <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary uppercase">
                                Customer Insight
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Customer Analysis
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                                Kumpulkan dan pahami persona narasumber dari
                                hasil wawancara di wilayah KDKMP Anda.
                            </p>
                        </div>
                        <Button onClick={openCreateForm} className="gap-2">
                            <Plus className="size-4" />+ Narasumber
                        </Button>
                    </section>

                    {customerAnalyses.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                                    <CircleUserRound className="size-8" />
                                </div>
                                <h2 className="text-lg font-semibold">
                                    Belum ada narasumber
                                </h2>
                                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                    Tambahkan hasil wawancara pertama untuk
                                    mulai membangun pemahaman tentang pelanggan
                                    Anda.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-5 gap-2"
                                    onClick={openCreateForm}
                                >
                                    <Plus className="size-4" />
                                    Tambah Narasumber
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {customerAnalyses.map((analysis) => (
                                <Card
                                    key={analysis.id}
                                    className="overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
                                >
                                    <PersonaIllustration
                                        occupationRole={
                                            analysis.occupation_role
                                        }
                                    />
                                    <CardHeader className="space-y-3 pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <Badge
                                                variant="outline"
                                                className="max-w-[70%] truncate"
                                            >
                                                {analysis.occupation_label}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={sentimentBadgeClass(
                                                    analysis.sentiment,
                                                )}
                                            >
                                                {analysis.sentiment_label}
                                            </Badge>
                                        </div>
                                        <div>
                                            <CardTitle className="line-clamp-1 text-lg">
                                                {analysis.full_name}
                                            </CardTitle>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {analysis.age} tahun ·{' '}
                                                {analysis.gender_label}
                                            </p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                                            {analysis.summary}
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() =>
                                                setDetailTarget(analysis)
                                            }
                                        >
                                            Lihat Detail
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </section>
                    )}
                </div>
            </main>

            <Dialog
                open={isFormOpen}
                onOpenChange={(open) => !open && closeForm()}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedAnalysis
                                ? 'Edit Narasumber'
                                : 'Tambah Narasumber'}
                        </DialogTitle>
                        <DialogDescription>
                            Catat profil dan hasil wawancara narasumber.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="full_name">Nama Lengkap</Label>
                                <Input
                                    id="full_name"
                                    value={data.full_name}
                                    onChange={(event) =>
                                        setData('full_name', event.target.value)
                                    }
                                    placeholder="Nama narasumber"
                                />
                                <FieldError message={errors.full_name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="occupation_role">
                                    Pekerjaan / Peran
                                </Label>
                                <Select
                                    value={data.occupation_role}
                                    onValueChange={(value) =>
                                        setData('occupation_role', value)
                                    }
                                >
                                    <SelectTrigger id="occupation_role">
                                        <SelectValue placeholder="Pilih pekerjaan atau peran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {occupationOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.occupation_role} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="age">Umur</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={data.age}
                                    onChange={(event) =>
                                        setData('age', event.target.value)
                                    }
                                    placeholder="Contoh: 34"
                                />
                                <FieldError message={errors.age} />
                            </div>

                            {data.occupation_role === 'other' && (
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="occupation_other">
                                        Pekerjaan / Peran Lainnya
                                    </Label>
                                    <Input
                                        id="occupation_other"
                                        value={data.occupation_other}
                                        onChange={(event) =>
                                            setData(
                                                'occupation_other',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Tulis pekerjaan atau peran narasumber"
                                    />
                                    <FieldError
                                        message={errors.occupation_other}
                                    />
                                </div>
                            )}

                            <fieldset className="space-y-2 sm:col-span-2">
                                <legend className="text-sm font-medium">
                                    Jenis Kelamin
                                </legend>
                                <div className="flex flex-wrap gap-4 pt-1">
                                    {[
                                        { value: 'male', label: 'Laki-laki' },
                                        { value: 'female', label: 'Perempuan' },
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className="flex cursor-pointer items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={option.value}
                                                checked={
                                                    data.gender === option.value
                                                }
                                                onChange={() =>
                                                    setData(
                                                        'gender',
                                                        option.value,
                                                    )
                                                }
                                                className="size-4 accent-primary"
                                            />
                                            {option.label}
                                        </label>
                                    ))}
                                </div>
                                <FieldError message={errors.gender} />
                            </fieldset>

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="interview_purpose">
                                    Tujuan Wawancara
                                </Label>
                                <textarea
                                    id="interview_purpose"
                                    value={data.interview_purpose}
                                    onChange={(event) =>
                                        setData(
                                            'interview_purpose',
                                            event.target.value,
                                        )
                                    }
                                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    placeholder="Tuliskan tujuan wawancara"
                                />
                                <FieldError
                                    message={errors.interview_purpose}
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="summary">
                                    Rangkuman yang Didapat
                                </Label>
                                <textarea
                                    id="summary"
                                    value={data.summary}
                                    onChange={(event) =>
                                        setData('summary', event.target.value)
                                    }
                                    className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    placeholder="Tuliskan temuan utama dari wawancara"
                                />
                                <FieldError message={errors.summary} />
                            </div>

                            <div className="space-y-3 sm:col-span-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Label htmlFor="sentiment">Sentimen</Label>
                                    <Badge
                                        variant="outline"
                                        className={sentimentBadgeClass(
                                            data.sentiment,
                                        )}
                                    >
                                        {data.sentiment} ·{' '}
                                        {currentSentiment?.label ?? 'Netral'}
                                    </Badge>
                                </div>
                                <input
                                    id="sentiment"
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={data.sentiment}
                                    onChange={(event) =>
                                        setData(
                                            'sentiment',
                                            Number(event.target.value),
                                        )
                                    }
                                    className="h-2 w-full cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>1 Negatif</span>
                                    <span>3 Netral</span>
                                    <span>5 Positif</span>
                                </div>
                                <FieldError message={errors.sentiment} />
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
                                {processing
                                    ? 'Menyimpan...'
                                    : selectedAnalysis
                                      ? 'Simpan Perubahan'
                                      : 'Simpan Narasumber'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={detailTarget !== null}
                onOpenChange={(open) => !open && setDetailTarget(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    {detailTarget && (
                        <>
                            <div className="overflow-hidden rounded-xl">
                                <PersonaIllustration
                                    occupationRole={
                                        detailTarget.occupation_role
                                    }
                                />
                            </div>
                            <DialogHeader>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">
                                        {detailTarget.occupation_label}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={sentimentBadgeClass(
                                            detailTarget.sentiment,
                                        )}
                                    >
                                        <Smile className="mr-1 size-3.5" />
                                        {detailTarget.sentiment_label}
                                    </Badge>
                                </div>
                                <DialogTitle>
                                    {detailTarget.full_name}
                                </DialogTitle>
                                <DialogDescription>
                                    {detailTarget.age} tahun ·{' '}
                                    {detailTarget.gender_label}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5 text-sm">
                                <section>
                                    <p className="font-medium text-foreground">
                                        Tujuan Wawancara
                                    </p>
                                    <p className="mt-1 leading-6 whitespace-pre-wrap text-muted-foreground">
                                        {detailTarget.interview_purpose}
                                    </p>
                                </section>
                                <section>
                                    <p className="font-medium text-foreground">
                                        Rangkuman yang Didapat
                                    </p>
                                    <p className="mt-1 leading-6 whitespace-pre-wrap text-muted-foreground">
                                        {detailTarget.summary}
                                    </p>
                                </section>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setDetailTarget(null)}
                                >
                                    Tutup
                                </Button>
                                <Button
                                    className="gap-2"
                                    onClick={() => openEditForm(detailTarget)}
                                >
                                    <Pencil className="size-4" />
                                    Edit
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
