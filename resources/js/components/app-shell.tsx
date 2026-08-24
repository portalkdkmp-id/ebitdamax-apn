import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { ChatbotComingSoon } from '@/components/chatbot-coming-soon';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { AppVariant } from '@/types';

type Props = {
    children: ReactNode;
    className?: string;
    variant?: AppVariant;
};

export function AppShell({ children, className, variant = 'sidebar' }: Props) {
    const isOpen = usePage().props.sidebarOpen;

    if (variant === 'header') {
        return (
            <div className={cn('flex min-h-screen w-full flex-col', className)}>
                {children}
                <ChatbotComingSoon />
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen}>
            {children}
            <ChatbotComingSoon />
        </SidebarProvider>
    );
}
