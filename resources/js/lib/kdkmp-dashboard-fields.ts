import type { KdkmpManualFields } from '@/types/kdkmp-dashboard';

export type KdkmpManualField = {
    key: keyof KdkmpManualFields;
    label: string;
    isRupiah?: boolean;
    placeholder?: string;
};

export const kdkmpManualFields: KdkmpManualField[] = [
    { key: 'target_revenue', label: 'Target Revenue', isRupiah: true },
    { key: 'plan_revenue', label: 'Plan Revenue', isRupiah: true },
    { key: 'actual_revenue', label: 'Actual Revenue', isRupiah: true },
    { key: 'target_cost', label: 'Target Cost', isRupiah: true },
    { key: 'plan_cost', label: 'Plan Cost', isRupiah: true },
    { key: 'actual_cost', label: 'Actual Cost', isRupiah: true },
    { key: 'target_ebitda', label: 'Target EBITDA', isRupiah: true },
    { key: 'plan_ebitda', label: 'Plan EBITDA', isRupiah: true },
    { key: 'actual_ebitda', label: 'Actual EBITDA', isRupiah: true },
    {
        key: 'target_ebitda_margin',
        label: 'Target EBITDA Margin (%)',
        placeholder: 'Contoh: 20%',
    },
    {
        key: 'actual_ebitda_margin',
        label: 'Actual EBITDA Margin (%)',
        placeholder: 'Contoh: 18,5%',
    },
    {
        key: 'total_duration',
        label: 'Total Duration',
        placeholder: 'Contoh: 8 jam 30 menit',
    },
    {
        key: 'performance_scoring',
        label: 'Performance Scoring',
        placeholder: 'Contoh: 85%',
    },
];
