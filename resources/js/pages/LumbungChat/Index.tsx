import { Head } from '@inertiajs/react';
import { ExternalLink, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type Props = {
    chatUrl: string;
};

const breadcrumbs = [
    {
        title: 'Chat Lumbung KMS',
        href: '/lumbung-kms/chat',
    },
];

export default function LumbungChatIndex({ chatUrl }: Props) {
    return (
        <>
            <Head title="Chat Lumbung KMS" />

            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                <Alert>
                    <Info />
                    <AlertTitle>Login Lumbung diperlukan</AlertTitle>
                    <AlertDescription>
                        <p>
                            Sesi login EBITDA dan Lumbung terpisah. Silakan
                            masuk menggunakan akun Lumbung pada tampilan di
                            bawah.
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={chatUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Buka di tab baru
                                <ExternalLink />
                            </a>
                        </Button>
                    </AlertDescription>
                </Alert>

                <iframe
                    src={chatUrl}
                    title="Chat Lumbung KMS"
                    className="min-h-[640px] w-full flex-1 rounded-xl border border-sidebar-border bg-white shadow-sm"
                    allow="clipboard-read; clipboard-write"
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
        </>
    );
}

LumbungChatIndex.layout = {
    breadcrumbs,
};
