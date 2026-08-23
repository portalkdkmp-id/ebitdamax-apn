import type { KdkmpDashboardFields } from '@/types/kdkmp-dashboard';

export type KdkmpDashboardField = {
    key: keyof KdkmpDashboardFields;
    label: string;
    isRupiah?: boolean;
    isDisabled?: boolean;
    placeholder?: string;
    description?: string;
};

export const kdkmpDashboardFields: KdkmpDashboardField[] = [
    {
        key: 'target_revenue',
        label: 'Target Revenue (Hari Ini)',
        isRupiah: true,
        isDisabled: true,
        description: 'Target tetap yang ditentukan sistem.',
    },
    {
        key: 'plan_revenue',
        label: 'Plan Revenue',
        isRupiah: true,
        description: 'Diisi manual. Nilai 0 diperbolehkan.',
    },
    { key: 'actual_revenue', label: 'Actual Revenue', isRupiah: true },
    {
        key: 'variable_cost',
        label: 'Variable Cost',
        isRupiah: true,
        description:
            'Fallback input harian yang digunakan bila Variable Cost Master Task belum lengkap.',
    },
    {
        key: 'actual_cost',
        label: 'Actual Cost',
        isRupiah: true,
        isDisabled: true,
        description:
            'Akumulasi nilai numerik task Pencatatan Pengeluaran Operasional Harian yang selesai hari ini.',
    },
    {
        key: 'actual_ebitda_margin',
        label: 'Actual EBITDA Margin (%)',
        isDisabled: true,
        description:
            'Dihitung otomatis: ((Actual Revenue - Rp9.235.467) / Actual Revenue) x 100%.',
    },
    {
        key: 'total_duration',
        label: 'Total Duration',
        isDisabled: true,
        description: 'Akumulasi durasi seluruh task yang selesai hari ini.',
    },
    {
        key: 'performance_scoring',
        label: 'Performance Scoring',
        isDisabled: true,
        description:
            'Otomatis: 55% penyelesaian task + 30% kepatuhan ambang waktu + 15% pencapaian revenue.',
    },
];
