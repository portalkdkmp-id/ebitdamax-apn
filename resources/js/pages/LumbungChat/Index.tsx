import { Head } from '@inertiajs/react';

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

            <div className="flex min-h-0 flex-1 flex-col p-4">
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
