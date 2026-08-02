export const chartRed = '#dc2626';
export const chartDarkRed = '#991b1b';
export const chartLightRed = '#f87171';
export const chartSoftRed = '#fecaca';
export const chartSlate = '#475569';

export const costColors = [chartRed, chartDarkRed, chartLightRed];

export function compactNumber(value: number) {
    return new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(value ?? 0);
}

export function chartCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(value ?? 0);
}
