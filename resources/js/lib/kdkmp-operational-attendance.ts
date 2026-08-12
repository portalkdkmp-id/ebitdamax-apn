import type {
    KdkmpOperationalAttendance,
    KdkmpOperationalAttendanceKey,
} from '@/types/kdkmp-dashboard';

export const kdkmpOperationalAttendanceRoles: Array<{
    key: KdkmpOperationalAttendanceKey;
    label: string;
}> = [
    { key: 'pramuniaga', label: 'Pramuniaga' },
    { key: 'kasir', label: 'Kasir' },
    { key: 'karyawan_umkm', label: 'Karyawan UMKM' },
    { key: 'security', label: 'Security' },
    { key: 'driver_truck', label: 'Driver Truck' },
    { key: 'driver_pickup', label: 'Driver Pickup' },
    { key: 'driver_motor_roda_tiga', label: 'Driver Motor Roda Tiga' },
];

export function emptyKdkmpOperationalAttendance(): KdkmpOperationalAttendance {
    return {
        pramuniaga: 0,
        kasir: 0,
        karyawan_umkm: 0,
        security: 0,
        driver_truck: 0,
        driver_pickup: 0,
        driver_motor_roda_tiga: 0,
    };
}
