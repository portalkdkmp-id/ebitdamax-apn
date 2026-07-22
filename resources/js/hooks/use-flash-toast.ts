import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    const page = usePage();
    const data = page.props.flash?.toast as FlashToast | undefined;

    useEffect(() => {
        if (!data) {
            return;
        }

        toast[data.type](data.message);
    }, [data]);

    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const eventData = flash?.toast as FlashToast | undefined;

            if (!eventData) {
                return;
            }

            toast[eventData.type](eventData.message);
        });
    }, []);
}
