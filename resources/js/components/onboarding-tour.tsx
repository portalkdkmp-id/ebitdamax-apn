import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/auth';
import {
    index as kdkmpDashboardIndex,
    input as kdkmpDashboardInput,
} from '@/routes/kdkmp-dashboard';

type TourStep = {
    target: string;
    title: string;
    description: string;
    path: string;
};

type TargetRect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

const TOUR_STEPS: TourStep[] = [
    {
        target: '[data-tour="sidebar-navigation"]',
        title: 'Navigasi aplikasi',
        description:
            'Gunakan menu untuk membuka Dashboard KDKMP, Customer Analysis, Meeting, dan Tasks.',
        path: '/dashboard/kdkmp',
    },
    {
        target: '[data-tour="dashboard"]',
        title: 'Dashboard utama',
        description:
            'Periksa KDKMP, wilayah, tanggal laporan, ringkasan kinerja, dan grafik finansial harian.',
        path: '/dashboard/kdkmp',
    },
    {
        target: '[data-tour="kdkmp-daily-input"]',
        title: 'Input Data Hari Ini',
        description:
            'Isi revenue, cost, dan kehadiran anggota. Dari halaman ini Anda juga memilih bundle task BMC hari ini.',
        path: '/dashboard/kdkmp',
    },
    {
        target: '[data-tour="daily-plan-revenue"]',
        title: 'Plan Revenue',
        description:
            'Isi rencana pendapatan harian dalam Rupiah. Jika nilainya di bawah target, konfirmasi diperlukan sebelum data disimpan.',
        path: '/dashboard/kdkmp/input',
    },
    {
        target: '[data-tour="daily-variable-cost"]',
        title: 'Variable Cost',
        description:
            'Isi biaya variabel harian bila diperlukan. Target, pendapatan otomatis, actual cost, margin, durasi, dan performance scoring dihitung oleh sistem.',
        path: '/dashboard/kdkmp/input',
    },
    {
        target: '[data-tour="daily-operational-attendance"]',
        title: 'Kehadiran anggota',
        description:
            'Isi jumlah anggota hadir untuk tujuh role operasional. Isi 0 apabila tidak ada anggota pada role tersebut.',
        path: '/dashboard/kdkmp/input',
    },
    {
        target: '[data-tour="daily-save-attendance"]',
        title: 'Simpan kehadiran',
        description:
            'Simpan kehadiran sebelum memulai task. Nilai ini menjadi batas alokasi anggota pada setiap task.',
        path: '/dashboard/kdkmp/input',
    },
    {
        target: '[data-tour="daily-bmc-selection"]',
        title: 'Pilih bundle BMC',
        description:
            'Pilih task pilihan berdasarkan bundle BMC. Task wajib selalu terpilih dan tidak dapat dibatalkan.',
        path: '/dashboard/kdkmp/input',
    },
    {
        target: '[data-tour="daily-save-task-selection"]',
        title: 'Simpan pilihan task',
        description:
            'Simpan pilihan agar task yang dipilih muncul pada daftar eksekusi hari ini.',
        path: '/dashboard/kdkmp/input',
    },
    {
        target: '[data-tour="daily-save-report"]',
        title: 'Simpan data harian',
        description:
            'Simpan revenue dan cost setelah semua data diperiksa. Nilai 0 tetap dapat disimpan sebagai data valid.',
        path: '/dashboard/kdkmp/input',
    },
    {
        target: '[data-tour="task-dashboard"]',
        title: 'Daftar tugas',
        description:
            'Buka menu Tasks untuk memulai dan menyelesaikan task, mengalokasikan anggota, serta melampirkan foto atau dokumen.',
        path: '/dashboard/kdkmp/input',
    },
    {
        target: '[data-tour="user-menu"]',
        title: 'Menu akun',
        description:
            'Kelola profil, lihat dokumen SK Manager, atur keamanan akun, atau keluar dari aplikasi.',
        path: '/dashboard/kdkmp/input',
    },
];

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 240;
const ONBOARDING_STEP_STORAGE_KEY = 'kdkmp-manager-onboarding-step';

function getTargetRect(target: HTMLElement): TargetRect {
    const rect = target.getBoundingClientRect();

    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
    };
}

function getPopoverPosition(rect: TargetRect): { top: number; left: number } {
    const gap = 16;
    const top =
        rect.top + rect.height + gap + POPOVER_HEIGHT <= window.innerHeight
            ? rect.top + rect.height + gap
            : Math.max(gap, rect.top - POPOVER_HEIGHT - gap);
    const left = Math.min(
        Math.max(gap, rect.left),
        Math.max(gap, window.innerWidth - POPOVER_WIDTH - gap),
    );

    return { top, left };
}

export function OnboardingTour() {
    const page = usePage();
    const { auth } = page.props as { auth: { user: User | null } };
    const isKdkmpManager =
        auth.user?.role?.domain === 'kdkmp' &&
        auth.user.role.slug === 'manager';
    const hasCompletedOnboarding = auth.user?.has_completed_onboarding ?? true;
    const [isOpen, setIsOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

    const currentStep = TOUR_STEPS[stepIndex];
    const isLastStep = stepIndex === TOUR_STEPS.length - 1;
    const popoverPosition = useMemo(
        () => (targetRect ? getPopoverPosition(targetRect) : null),
        [targetRect],
    );

    const completeOnboarding = useCallback((): void => {
        sessionStorage.removeItem(ONBOARDING_STEP_STORAGE_KEY);
        setIsOpen(false);
        router.post(
            '/users/complete-onboarding',
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    }, []);

    useEffect(() => {
        if (!isKdkmpManager || hasCompletedOnboarding) {
            setIsOpen(false);
            setIsInitialized(false);
            return;
        }

        const savedStepIndex = Number.parseInt(
            sessionStorage.getItem(ONBOARDING_STEP_STORAGE_KEY) ?? '0',
            10,
        );
        const initialStepIndex =
            savedStepIndex >= 0 && savedStepIndex < TOUR_STEPS.length
                ? savedStepIndex
                : 0;
        const timer = window.setTimeout(() => {
            setStepIndex(initialStepIndex);
            setIsInitialized(true);
            setIsOpen(true);
        }, 200);

        return () => window.clearTimeout(timer);
    }, [hasCompletedOnboarding, isKdkmpManager]);

    const moveToStep = (nextStepIndex: number): void => {
        const nextStep = TOUR_STEPS[nextStepIndex];

        if (!nextStep) {
            return;
        }

        sessionStorage.setItem(
            ONBOARDING_STEP_STORAGE_KEY,
            String(nextStepIndex),
        );
        setStepIndex(nextStepIndex);

        if (nextStep.path !== page.url.split('?')[0]) {
            router.get(
                nextStep.path === '/dashboard/kdkmp'
                    ? kdkmpDashboardIndex.url()
                    : kdkmpDashboardInput.url(),
                {},
                { preserveScroll: false },
            );
        }
    };

    useEffect(() => {
        if (!isOpen || !isInitialized || !currentStep) {
            setTargetRect(null);
            return;
        }

        const target = document.querySelector<HTMLElement>(currentStep.target);

        if (!target) {
            setTargetRect(null);
            return;
        }

        const updatePosition = (): void => {
            const rect = getTargetRect(target);

            setTargetRect(rect.width > 0 && rect.height > 0 ? rect : null);
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [currentStep, isInitialized, isOpen, page.url]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                completeOnboarding();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [completeOnboarding, isOpen]);

    if (!isOpen || !currentStep || !targetRect || !popoverPosition) {
        return null;
    }

    return (
        <>
            <div
                aria-hidden="true"
                className="pointer-events-none fixed z-[60] rounded-md border-2 border-primary bg-transparent transition-all duration-200"
                style={{
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                    boxShadow:
                        '0 0 0 9999px rgba(15, 23, 42, 0.55), 0 0 0 4px rgba(255, 255, 255, 0.8)',
                }}
            />
            <section
                aria-label="Panduan penggunaan aplikasi"
                aria-live="polite"
                className="fixed z-[62] w-[min(320px,calc(100vw-32px))] rounded-xl border bg-card p-5 text-card-foreground shadow-2xl"
                style={popoverPosition}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium tracking-wide text-primary uppercase">
                            Langkah {stepIndex + 1} dari {TOUR_STEPS.length}
                        </p>
                        <h2 className="mt-1 text-base font-semibold">
                            {currentStep.title}
                        </h2>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Lewati onboarding"
                        onClick={completeOnboarding}
                    >
                        <X />
                    </Button>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {currentStep.description}
                </p>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={stepIndex === 0}
                        onClick={() => moveToStep(stepIndex - 1)}
                    >
                        <ArrowLeft />
                        Kembali
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                            isLastStep
                                ? completeOnboarding()
                                : moveToStep(stepIndex + 1)
                        }
                    >
                        {isLastStep ? <Check /> : <ArrowRight />}
                        {isLastStep ? 'Selesai' : 'Lanjutkan'}
                    </Button>
                </div>
            </section>
        </>
    );
}
