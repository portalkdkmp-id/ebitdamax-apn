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
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
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
    emptyKdkmpOperationalAttendance,
    kdkmpOperationalAttendanceRoles,
} from '@/lib/kdkmp-operational-attendance';
import {
    finish as finishTaskRoute,
    start as startTaskRoute,
} from '@/routes/tasks';
import type {
    TaskAdditionalFieldItem,
    TaskItem,
    TaskReportDocument,
} from '@/types/task';
import type {
    KdkmpOperationalAttendance,
    KdkmpOperationalAttendanceKey,
} from '@/types/kdkmp-dashboard';

type DashboardTask = TaskItem & {
    status: 'pending' | 'in_progress' | 'completed';
    status_label: string;
    documents: TaskReportDocument[];
};

type Props = {
    tasks: DashboardTask[];
    operationalAttendance: OperationalAttendanceContext | null;
    summary: {
        total: number;
        pending: number;
        in_progress: number;
        completed: number;
    };
};

type OperationalAttendanceContext = {
    business_date: string;
    is_saved: boolean;
    values: KdkmpOperationalAttendance;
    allocated: KdkmpOperationalAttendance;
    available: KdkmpOperationalAttendance;
};

type AdditionalFieldValue = string | string[] | boolean | File;

type TaskActionFormData = {
    started_photo: File | null;
    finished_photo: File | null;
    documents: File[];
    member_allocations?: KdkmpOperationalAttendance;
    values: Record<string, AdditionalFieldValue>;
};

const MAX_DOCUMENT_COUNT = 10;
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const TASK_DESCRIPTION_PREVIEW_LENGTH = 80;
const ADDITIONAL_FIELD_FILE_ACCEPT =
    '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png';

function formatFileSize(size: number): string {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function cameraAccessErrorMessage(error: unknown): string {
    const errorName = error instanceof DOMException ? error.name : null;

    switch (errorName) {
        case 'NotAllowedError':
            return 'Izin kamera ditolak atau diblokir. Izinkan kamera pada pengaturan browser, lalu coba lagi.';
        case 'NotFoundError':
            return 'Kamera tidak ditemukan pada perangkat ini. Pastikan kamera tersedia dan tidak dinonaktifkan.';
        case 'NotReadableError':
            return 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut, lalu coba lagi.';
        case 'SecurityError':
            return 'Akses kamera diblokir oleh keamanan browser. Gunakan halaman HTTPS.';
        case 'OverconstrainedError':
            return 'Kamera perangkat tidak sesuai dengan konfigurasi yang diminta. Coba gunakan kamera lain.';
        case 'AbortError':
            return 'Kamera tidak dapat dimulai. Silakan coba buka kamera lagi.';
        default:
            return 'Kamera tidak dapat diakses. Silakan coba lagi.';
    }
}

function fieldsFor(task: DashboardTask | null, showWhen: 'start' | 'finish') {
    return (
        task?.additional_fields.filter(
            (field) => field.show_when === showWhen,
        ) ?? []
    );
}

function TaskActionButton({
    task,
    onStart,
    onFinish,
}: {
    task: DashboardTask;
    onStart: (task: DashboardTask) => void;
    onFinish: (task: DashboardTask) => void;
}) {
    if (task.status === 'pending') {
        return (
            <Button type="button" size="sm" onClick={() => onStart(task)}>
                <Play className="size-4" />
                Mulai Task
            </Button>
        );
    }

    if (task.status === 'in_progress') {
        return (
            <Button type="button" size="sm" onClick={() => onFinish(task)}>
                <CheckCircle2 className="size-4" />
                Selesaikan Task
            </Button>
        );
    }

    return null;
}

function truncateTaskDescription(description: string | null): string {
    const fullDescription = description?.trim() || '-';
    const descriptionCharacters = Array.from(fullDescription);

    if (descriptionCharacters.length <= TASK_DESCRIPTION_PREVIEW_LENGTH) {
        return fullDescription;
    }

    return `${descriptionCharacters
        .slice(0, TASK_DESCRIPTION_PREVIEW_LENGTH)
        .join('')
        .trimEnd()}…`;
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
    if (field.input_type === 'file') {
        const selectedFile = value instanceof File ? value : null;

        return (
            <div className="space-y-2">
                <Input
                    type="file"
                    accept={ADDITIONAL_FIELD_FILE_ACCEPT}
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                            onChange(file);
                        }
                    }}
                />
                <p className="text-xs text-muted-foreground">
                    Maksimal 10 MB. Format: PDF, Office, TXT, CSV, JPG, atau
                    PNG.
                </p>
                {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                        Dipilih: {selectedFile.name} ·{' '}
                        {formatFileSize(selectedFile.size)}
                    </p>
                )}
            </div>
        );
    }

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

export default function TaskDashboardIndex({
    tasks,
    operationalAttendance,
    summary,
}: Props) {
    const [startTask, setStartTask] = useState<DashboardTask | null>(null);
    const [finishTask, setFinishTask] = useState<DashboardTask | null>(null);
    const taskGroups = useMemo(() => {
        const groups = new Map<
            number,
            {
                category: DashboardTask['task_category'];
                tasks: DashboardTask[];
            }
        >();

        tasks.forEach((task) => {
            const group = groups.get(task.task_category.id);

            if (group) {
                group.tasks.push(task);

                return;
            }

            groups.set(task.task_category.id, {
                category: task.task_category,
                tasks: [task],
            });
        });

        return Array.from(groups.values());
    }, [tasks]);

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

                    <Card className="rounded-2xl border bg-card shadow-sm">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle>Daftar Task</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="px-3 pb-3 sm:px-4">
                                <Table className="border-separate border-spacing-y-2">
                                    <TableHeader className="[&_tr]:border-0">
                                        <TableRow className="border-0 hover:bg-transparent">
                                            <TableHead className="rounded-xl bg-muted/40 p-4">
                                                Nama Task
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tasks.length === 0 && (
                                            <TableRow className="border-0 hover:bg-transparent">
                                                <TableCell className="rounded-xl border border-dashed bg-muted/20 p-8 text-center text-muted-foreground">
                                                    Belum ada task untuk role
                                                    ini.
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {taskGroups.map((group) => (
                                            <Fragment key={group.category.id}>
                                                <TableRow className="border-0 hover:bg-transparent">
                                                    <TableCell className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                                                        <div className="inline-flex rounded-md border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-foreground">
                                                            {
                                                                group.category
                                                                    .name
                                                            }
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {group.tasks.map((task) => (
                                                    <TableRow
                                                        key={task.uuid}
                                                        className="border-0 hover:bg-transparent"
                                                    >
                                                        <TableCell className="rounded-xl border bg-card p-4">
                                                            <div className="flex items-start gap-3 sm:px-3">
                                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                                    <ClipboardList className="size-5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                                                                        <p className="font-medium text-foreground">
                                                                            {
                                                                                task.name
                                                                            }
                                                                        </p>
                                                                        <Badge
                                                                            variant={
                                                                                task.bmc_status ===
                                                                                'belum_dipetakan'
                                                                                    ? 'outline'
                                                                                    : 'secondary'
                                                                            }
                                                                        >
                                                                            {
                                                                                task.bmc_status_label
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-xs break-words text-muted-foreground">
                                                                        {truncateTaskDescription(
                                                                            task.description,
                                                                        )}
                                                                    </p>
                                                                    <div className="mt-3 grid gap-3 border-t pt-3 text-xs sm:grid-cols-3">
                                                                        <div>
                                                                            <p className="font-semibold tracking-wide text-muted-foreground uppercase">
                                                                                Jam
                                                                                Pelaksanaan
                                                                            </p>
                                                                            <p className="mt-1 font-medium text-foreground">
                                                                                {task.execution_time ??
                                                                                    '-'}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold tracking-wide text-muted-foreground uppercase">
                                                                                Estimasi
                                                                                Waktu
                                                                            </p>
                                                                            <p className="mt-1 font-medium text-foreground">
                                                                                {
                                                                                    task.time_require
                                                                                }{' '}
                                                                                menit
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold tracking-wide text-muted-foreground uppercase">
                                                                                Status
                                                                            </p>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="mt-1"
                                                                            >
                                                                                {
                                                                                    task.status_label
                                                                                }
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    {task.status !==
                                                                        'completed' && (
                                                                        <div className="mt-3">
                                                                            <TaskActionButton
                                                                                task={
                                                                                    task
                                                                                }
                                                                                onStart={
                                                                                    setStartTask
                                                                                }
                                                                                onFinish={
                                                                                    setFinishTask
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
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
                operationalAttendance={operationalAttendance}
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
    operationalAttendance,
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
    operationalAttendance?: OperationalAttendanceContext | null;
    existingDocuments: TaskReportDocument[];
    submitLabel: string;
}) {
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const cameraRequestRef = useRef(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [compressionLabel, setCompressionLabel] = useState<string | null>(
        null,
    );
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [isOpeningCamera, setIsOpeningCamera] = useState(false);
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
        member_allocations: operationalAttendance
            ? emptyKdkmpOperationalAttendance()
            : undefined,
        values: {},
    });
    const shouldShowMemberAllocations =
        operationalAttendance !== undefined && operationalAttendance !== null;
    const mustSaveOperationalAttendance =
        shouldShowMemberAllocations && !operationalAttendance.is_saved;
    const memberAllocationValidationErrors: Partial<
        Record<KdkmpOperationalAttendanceKey, string>
    > = {};

    if (shouldShowMemberAllocations && operationalAttendance) {
        for (const role of kdkmpOperationalAttendanceRoles) {
            const allocation = data.member_allocations?.[role.key] ?? 0;
            const available = operationalAttendance.available[role.key];

            if (allocation > available) {
                memberAllocationValidationErrors[role.key] =
                    `Jumlah alokasi melebihi sisa anggota yang tersedia (Sisa: ${available})`;
            }
        }
    }

    const hasMemberAllocationValidationErrors =
        Object.keys(memberAllocationValidationErrors).length > 0;
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

    const releaseCamera = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCameraStream(null);
        setCameraActive(false);
    };

    const stopCamera = () => {
        cameraRequestRef.current += 1;
        releaseCamera();
        setIsOpeningCamera(false);
    };

    useEffect(() => {
        const video = videoRef.current;

        if (!cameraStream || !video) {
            return;
        }

        const playPreview = async () => {
            try {
                await video.play();
            } catch (error) {
                setCameraError(cameraAccessErrorMessage(error));
            }
        };
        const handleLoadedMetadata = () => {
            void playPreview();
        };

        video.srcObject = cameraStream;

        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            void playPreview();
        } else {
            video.addEventListener('loadedmetadata', handleLoadedMetadata, {
                once: true,
            });
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.pause();

            if (video.srcObject === cameraStream) {
                video.srcObject = null;
            }
        };
    }, [cameraStream]);

    useEffect(() => {
        return () => {
            cameraRequestRef.current += 1;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, []);

    const openCamera = async () => {
        setCameraError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError(
                'Kamera hanya dapat diakses melalui browser modern pada halaman HTTPS.',
            );

            return;
        }

        const requestId = cameraRequestRef.current + 1;
        cameraRequestRef.current = requestId;
        releaseCamera();
        setIsOpeningCamera(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'user' },
                },
                audio: false,
            });

            if (cameraRequestRef.current !== requestId) {
                stream.getTracks().forEach((track) => track.stop());

                return;
            }

            streamRef.current = stream;
            setCameraStream(stream);
            setCameraActive(true);
        } catch (error) {
            if (cameraRequestRef.current === requestId) {
                setCameraError(cameraAccessErrorMessage(error));
            }
        } finally {
            if (cameraRequestRef.current === requestId) {
                setIsOpeningCamera(false);
            }
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
                                            autoPlay
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
                                            disabled={
                                                cameraActive || isOpeningCamera
                                            }
                                        >
                                            <Camera className="size-4" />
                                            {isOpeningCamera
                                                ? 'Membuka Kamera...'
                                                : 'Buka Kamera'}
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

                    {shouldShowMemberAllocations && operationalAttendance && (
                        <div className="space-y-4 rounded-lg border p-4">
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Alokasi Anggota untuk Task
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Sisa kuota setiap role dihitung dari
                                    kehadiran dikurangi task berjalan yang
                                    dimulai pada tanggal{' '}
                                    {new Intl.DateTimeFormat('id-ID', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    }).format(
                                        new Date(
                                            `${operationalAttendance.business_date}T00:00:00`,
                                        ),
                                    )}
                                    .
                                </p>
                            </div>

                            {mustSaveOperationalAttendance ? (
                                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                    Kehadiran anggota hari ini belum disimpan.
                                    Buka Dashboard KDKMP dan simpan kehadiran
                                    terlebih dahulu.
                                </p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {kdkmpOperationalAttendanceRoles.map(
                                        (role) => {
                                            const currentAllocation =
                                                data.member_allocations?.[
                                                    role.key
                                                ] ?? 0;
                                            const totalAttendance =
                                                operationalAttendance.values[
                                                    role.key
                                                ];
                                            const allocated =
                                                operationalAttendance.allocated[
                                                    role.key
                                                ];
                                            const available =
                                                operationalAttendance.available[
                                                    role.key
                                                ];
                                            const allocationError =
                                                memberAllocationValidationErrors[
                                                    role.key
                                                ] ??
                                                errors[
                                                    `member_allocations.${role.key}`
                                                ];

                                            return (
                                                <div
                                                    key={role.key}
                                                    className="space-y-2"
                                                >
                                                    <Label
                                                        htmlFor={`member-allocation-${photoField}-${role.key}`}
                                                    >
                                                        {role.label}
                                                    </Label>
                                                    <Input
                                                        id={`member-allocation-${photoField}-${role.key}`}
                                                        type="number"
                                                        inputMode="numeric"
                                                        min="0"
                                                        step="1"
                                                        value={
                                                            currentAllocation
                                                        }
                                                        aria-invalid={Boolean(
                                                            allocationError,
                                                        )}
                                                        onChange={(event) => {
                                                            const value =
                                                                Math.max(
                                                                    0,
                                                                    Math.floor(
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
                                                                    ),
                                                                );

                                                            setData(
                                                                'member_allocations',
                                                                {
                                                                    ...(data.member_allocations ??
                                                                        emptyKdkmpOperationalAttendance()),
                                                                    [role.key]:
                                                                        value,
                                                                },
                                                            );
                                                        }}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Hadir: {totalAttendance}{' '}
                                                        · Sedang dialokasikan:{' '}
                                                        {allocated} · Sisa
                                                        tersedia: {available}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Sisa setelah alokasi
                                                        ini:{' '}
                                                        {Math.max(
                                                            0,
                                                            available -
                                                                currentAllocation,
                                                        )}
                                                    </p>
                                                    {allocationError && (
                                                        <p className="text-sm text-destructive">
                                                            {allocationError}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            )}

                            {errors.member_allocations && (
                                <p className="text-sm text-destructive">
                                    {errors.member_allocations}
                                </p>
                            )}
                        </div>
                    )}

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
                        disabled={
                            processing ||
                            mustSaveOperationalAttendance ||
                            hasMemberAllocationValidationErrors
                        }
                        onClick={handleSubmit}
                    >
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
