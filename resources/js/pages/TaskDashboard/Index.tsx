import { Head, useForm } from '@inertiajs/react';
import {
    Camera,
    CheckCircle2,
    ClipboardList,
    Clock,
    Download,
    Eye,
    FileText,
    ImageIcon,
    Images,
    Paperclip,
    Play,
    X,
} from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
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
import {
    finish as finishTaskRoute,
    start as startTaskRoute,
} from '@/routes/tasks';
import type {
    TaskAdditionalFieldItem,
    TaskItem,
    TaskReportDocument,
} from '@/types/task';

type DashboardTask = TaskItem & {
    status: 'pending' | 'in_progress' | 'completed';
    status_label: string;
    documents: TaskReportDocument[];
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

type AdditionalFieldValue = string | string[] | boolean;

type TaskActionFormData = {
    started_photo: File | null;
    finished_photo: File | null;
    documents: File[];
    values: Record<string, AdditionalFieldValue>;
};

const MAX_DOCUMENT_COUNT = 10;
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(size: number): string {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fieldsFor(task: DashboardTask | null, showWhen: 'start' | 'finish') {
    return (
        task?.additional_fields.filter(
            (field) => field.show_when === showWhen,
        ) ?? []
    );
}

function FieldPreview({
    field,
    value,
    onChange,
}: {
    field: TaskAdditionalFieldItem;
    value: AdditionalFieldValue | undefined;
    onChange: (value: AdditionalFieldValue) => void;
}) {
    if (field.input_type === 'textarea') {
        return (
            <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none"
                placeholder={field.label}
                value={(value as string | undefined) ?? ''}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    if (field.input_type === 'select') {
        return (
            <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={(value as string | undefined) ?? ''}
                onChange={(event) => onChange(event.target.value)}
            >
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
                            checked={
                                field.input_type === 'checkbox'
                                    ? Array.isArray(value) &&
                                      value.includes(option)
                                    : value === option
                            }
                            onChange={(event) => {
                                if (field.input_type === 'radio') {
                                    onChange(option);

                                    return;
                                }

                                const current = Array.isArray(value)
                                    ? value
                                    : [];

                                onChange(
                                    event.target.checked
                                        ? [...current, option]
                                        : current.filter(
                                              (item) => item !== option,
                                          ),
                                );
                            }}
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
                <input
                    type="checkbox"
                    checked={value === true}
                    onChange={(event) => onChange(event.target.checked)}
                />
                Ya
            </label>
        );
    }

    const type =
        field.input_type === 'datetime' ? 'datetime-local' : field.input_type;

    return (
        <Input
            type={type}
            placeholder={field.label}
            value={(value as string | undefined) ?? ''}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
        return file;
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const element = new Image();

            element.onload = () => resolve(element);
            element.onerror = reject;
            element.src = reader.result as string;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const maxSize = 1280;
    const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);

    const context = canvas.getContext('2d');

    if (!context) {
        return file;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.72);
    });

    if (!blob || blob.size >= file.size) {
        return file;
    }

    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
    });
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

                    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                                            PIC Roles
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
                                                <div className="flex flex-wrap gap-2">
                                                    {task.roles.map((role) => (
                                                        <Badge key={role.id}>
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                </div>
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
                actionUrl={startTask ? startTaskRoute.url(startTask.id) : ''}
                photoLabel="Foto Mulai"
                photoField="started_photo"
                fields={startFields}
                existingDocuments={[]}
                submitLabel="Mulai"
            />

            <TaskActionDialog
                title="Selesaikan Task"
                open={finishTask !== null}
                onOpenChange={(open) => !open && setFinishTask(null)}
                actionUrl={finishTask ? finishTaskRoute.url(finishTask.id) : ''}
                photoLabel="Foto Selesai"
                photoField="finished_photo"
                fields={finishFields}
                existingDocuments={finishTask?.documents ?? []}
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
    actionUrl,
    photoLabel,
    photoField,
    fields,
    existingDocuments,
    submitLabel,
}: {
    title: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actionUrl: string;
    photoLabel: string;
    photoField: 'started_photo' | 'finished_photo';
    fields: TaskAdditionalFieldItem[];
    existingDocuments: TaskReportDocument[];
    submitLabel: string;
}) {
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [compressionLabel, setCompressionLabel] = useState<string | null>(
        null,
    );
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [documentInputKey, setDocumentInputKey] = useState(0);
    const [documentSelectionError, setDocumentSelectionError] = useState<
        string | null
    >(null);
    const {
        data,
        setData,
        post,
        processing,
        progress,
        errors,
        reset,
        clearErrors,
    } = useForm<TaskActionFormData>({
        started_photo: null,
        finished_photo: null,
        documents: [],
        values: {},
    });
    const documentError =
        documentSelectionError ??
        errors.documents ??
        Object.entries(errors).find(([field]) =>
            field.startsWith('documents.'),
        )?.[1];

    const handlePhotoChange = async (file: File | null) => {
        if (!file) {
            return;
        }

        setCompressionLabel('Mengompres foto...');

        const compressedFile = await compressImage(file);
        const beforeKb = Math.round(file.size / 1024);
        const afterKb = Math.round(compressedFile.size / 1024);

        setData(photoField, compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));
        setCompressionLabel(
            compressedFile.size < file.size
                ? `Dikompres dari ${beforeKb} KB menjadi ${afterKb} KB`
                : `${afterKb} KB`,
        );
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCameraActive(false);
    };

    const openCamera = async () => {
        setCameraError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError('Browser tidak mendukung akses kamera langsung.');

            return;
        }

        try {
            stopCamera();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                },
                audio: false,
            });

            streamRef.current = stream;
            setCameraActive(true);
            await new Promise((resolve) => requestAnimationFrame(resolve));

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch {
            setCameraError(
                'Kamera tidak dapat diakses. Pastikan permission kamera diizinkan.',
            );
        }
    };

    const captureCameraPhoto = async () => {
        const video = videoRef.current;

        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
            setCameraError('Kamera belum siap. Coba beberapa detik lagi.');

            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');

        if (!context) {
            setCameraError('Foto tidak dapat diproses.');

            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });

        if (!blob) {
            setCameraError('Foto tidak dapat diproses.');

            return;
        }

        const file = new File([blob], `task-photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });

        stopCamera();
        await handlePhotoChange(file);
    };

    const handleValueChange = (
        field: TaskAdditionalFieldItem,
        value: AdditionalFieldValue,
    ) => {
        if (!field.field_name) {
            return;
        }

        setData('values', {
            ...data.values,
            [field.field_name]: value,
        });
    };

    const handleDocumentSelection = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedDocuments = Array.from(event.target.files ?? []);

        if (selectedDocuments.length === 0) {
            return;
        }

        const oversizedDocument = selectedDocuments.find(
            (document) => document.size > MAX_DOCUMENT_SIZE_BYTES,
        );

        if (oversizedDocument) {
            setDocumentSelectionError(
                `File "${oversizedDocument.name}" ditolak karena ukurannya lebih dari 10 MB.`,
            );
            setDocumentInputKey((current) => current + 1);

            return;
        }

        if (
            data.documents.length + selectedDocuments.length >
            MAX_DOCUMENT_COUNT
        ) {
            setDocumentSelectionError(
                'Maksimal 10 dokumen dalam satu kali upload.',
            );
            setDocumentInputKey((current) => current + 1);

            return;
        }

        setDocumentSelectionError(null);
        setData('documents', [...data.documents, ...selectedDocuments]);
        setDocumentInputKey((current) => current + 1);
    };

    const removeSelectedDocument = (index: number) => {
        setDocumentSelectionError(null);
        setData(
            'documents',
            data.documents.filter(
                (_, documentIndex) => documentIndex !== index,
            ),
        );
    };

    const closeDialog = () => {
        reset();
        clearErrors();
        stopCamera();
        setPreviewUrl(null);
        setCompressionLabel(null);
        setCameraError(null);
        setDocumentSelectionError(null);
        setDocumentInputKey((current) => current + 1);

        if (galleryInputRef.current) {
            galleryInputRef.current.value = '';
        }

        onOpenChange(false);
    };

    const handleSubmit = () => {
        if (!actionUrl) {
            return;
        }

        post(actionUrl, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: closeDialog,
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    closeDialog();
                }
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Lengkapi foto, dokumen, dan field tambahan yang
                        dibutuhkan.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label>{photoLabel}</Label>
                        <div className="rounded-lg border bg-background p-4">
                            <input
                                ref={galleryInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                    void handlePhotoChange(
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />

                            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md border bg-muted">
                                    {cameraActive ? (
                                        <video
                                            ref={videoRef}
                                            className="h-full w-full object-cover"
                                            muted
                                            playsInline
                                        />
                                    ) : previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview foto task"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <ImageIcon className="size-10" />
                                            <span className="text-xs">
                                                Preview foto
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center gap-3">
                                    <div>
                                        <p className="text-sm font-medium">
                                            Ambil foto atau pilih dari galeri
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Foto akan dikompres otomatis sebelum
                                            diupload.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => void openCamera()}
                                        >
                                            <Camera className="size-4" />
                                            Buka Kamera
                                        </Button>
                                        {cameraActive && (
                                            <>
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        void captureCameraPhoto()
                                                    }
                                                >
                                                    <Camera className="size-4" />
                                                    Capture
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={stopCamera}
                                                >
                                                    Tutup Kamera
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                galleryInputRef.current?.click()
                                            }
                                        >
                                            <Images className="size-4" />
                                            Pilih Galeri
                                        </Button>
                                        {compressionLabel && (
                                            <Badge variant="secondary">
                                                {compressionLabel}
                                            </Badge>
                                        )}
                                    </div>
                                    {cameraError && (
                                        <p className="text-sm text-destructive">
                                            {cameraError}
                                        </p>
                                    )}
                                    {errors[photoField] && (
                                        <p className="text-sm text-destructive">
                                            {errors[photoField]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-lg border p-4">
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold">
                                <Paperclip className="size-4" />
                                Dokumen Pendukung
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Maksimal 10 file per tahap dan 10 MB per file.
                            </p>
                        </div>

                        {existingDocuments.length > 0 && (
                            <div className="space-y-2">
                                <Label>Dokumen tahap sebelumnya</Label>
                                {existingDocuments.map((document, index) => (
                                    <div
                                        key={`${document.phase}-${document.name}-${index}`}
                                        className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <FileText className="size-5 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {document.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {document.phase_label} ·{' '}
                                                    {formatFileSize(
                                                        document.size,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a
                                                    href={document.preview_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Eye className="size-4" />
                                                    Preview
                                                </a>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a href={document.download_url}>
                                                    <Download className="size-4" />
                                                    Download
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor={`${photoField}-documents`}>
                                Upload dokumen
                            </Label>
                            <Input
                                key={documentInputKey}
                                id={`${photoField}-documents`}
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png"
                                onChange={handleDocumentSelection}
                                disabled={
                                    processing ||
                                    data.documents.length >= MAX_DOCUMENT_COUNT
                                }
                            />
                            {documentError && (
                                <p className="text-sm text-destructive">
                                    {documentError}
                                </p>
                            )}
                        </div>

                        {data.documents.length > 0 && (
                            <div className="space-y-2">
                                <Label>Dokumen yang akan diupload</Label>
                                {data.documents.map((document, index) => (
                                    <div
                                        key={`${document.name}-${document.lastModified}-${index}`}
                                        className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 p-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <FileText className="size-5 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {document.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(
                                                        document.size,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                removeSelectedDocument(index)
                                            }
                                            aria-label={`Hapus ${document.name}`}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {progress && (
                            <div className="space-y-1">
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{
                                            width: `${progress.percentage}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Mengunggah {progress.percentage}%
                                </p>
                            </div>
                        )}
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
                            <FieldPreview
                                field={field}
                                value={
                                    field.field_name
                                        ? data.values[field.field_name]
                                        : undefined
                                }
                                onChange={(value) =>
                                    handleValueChange(field, value)
                                }
                            />
                            {field.field_name &&
                                errors[`values.${field.field_name}`] && (
                                    <p className="text-sm text-destructive">
                                        {errors[`values.${field.field_name}`]}
                                    </p>
                                )}
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={handleSubmit}
                    >
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
