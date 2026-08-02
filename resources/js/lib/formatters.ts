export function formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

export function formatCompactCurrency(
    value: number | null | undefined,
): string {
    return new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(value ?? 0);
}

export function formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) {
        return 'N/A';
    }

    return `${value.toFixed(2)}%`;
}
