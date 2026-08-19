import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/auth';

type TourStep = {
    target: string;
    title: string;
    description: string;
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
            'Gunakan menu di sisi kiri untuk berpindah antar dashboard dan fitur yang tersedia untuk akun Anda.',
    },
    {
        target: '[data-tour="page-content"]',
        title: 'Area kerja',
        description:
            'Area ini menampilkan data, ringkasan, dan formulir sesuai menu yang sedang Anda buka.',
    },
    {
        target: '[data-tour="dashboard"]',
        title: 'Dashboard utama',
        description:
            'Akses ringkasan kinerja dan informasi utama dari dashboard sesuai peran serta cakupan akses Anda.',
    },
    {
        target: '[data-tour="kdkmp-daily-input"]',
        title: 'Input Data Hari Ini',
        description:
            'Gunakan tombol ini untuk mengisi laporan operasional dan data keuangan KDKMP pada hari berjalan.',
    },
    {
        target: '[data-tour="task-dashboard"]',
        title: 'Daftar tugas',
        description:
            'Pantau tugas yang perlu dikerjakan, mulai pekerjaan, dan kirimkan laporan penyelesaiannya dari menu Tasks.',
    },
    {
        target: '[data-tour="user-menu"]',
        title: 'Menu akun',
        description:
            'Kelola profil, keamanan akun, atau keluar dari aplikasi melalui menu akun di bagian bawah sidebar.',
    },
];

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 190;

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
    const { auth } = usePage().props as { auth: { user: User | null } };
    const isKdkmpManager =
        auth.user?.role?.domain === 'kdkmp' && auth.user.role.slug === 'manager';
    const hasCompletedOnboarding =
        auth.user?.has_completed_onboarding ?? true;
    const [isOpen, setIsOpen] = useState(false);
    const [steps, setSteps] = useState<TourStep[]>([]);
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

    const currentStep = steps[stepIndex];
    const isLastStep = stepIndex === steps.length - 1;
    const popoverPosition = useMemo(
        () => (targetRect ? getPopoverPosition(targetRect) : null),
        [targetRect],
    );

    const completeOnboarding = useCallback((): void => {
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
            return;
        }

        const timer = window.setTimeout(() => {
            const visibleSteps = TOUR_STEPS.filter((step) => {
                const target = document.querySelector<HTMLElement>(step.target);

                if (!target) {
                    return false;
                }

                const rect = target.getBoundingClientRect();

                return rect.width > 0 && rect.height > 0;
            });

            setSteps(visibleSteps);
            setStepIndex(0);
            setIsOpen(visibleSteps.length > 0);
        }, 200);

        return () => window.clearTimeout(timer);
    }, [hasCompletedOnboarding, isKdkmpManager]);

    useEffect(() => {
        if (!isOpen || !currentStep) {
            setTargetRect(null);
            return;
        }

        const target = document.querySelector<HTMLElement>(
            currentStep.target,
        );

        if (!target) {
            setTargetRect(null);
            return;
        }

        const updatePosition = (): void => {
            setTargetRect(getTargetRect(target));
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [currentStep, isOpen]);

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
                            Langkah {stepIndex + 1} dari {steps.length}
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

                <div className="mt-5 flex items-center justify-between gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={completeOnboarding}
                    >
                        Lewati Onboarding
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={stepIndex === 0}
                            onClick={() => setStepIndex((index) => index - 1)}
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
                                    : setStepIndex((index) => index + 1)
                            }
                        >
                            {isLastStep ? <Check /> : <ArrowRight />}
                            {isLastStep ? 'Selesai' : 'Lanjutkan'}
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
