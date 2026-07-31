import { Head } from '@inertiajs/react';

type Props = {
    lmsUrl: string;
};

const breadcrumbs = [
    {
        title: 'LMS KDKMP',
        href: '/lms-kdkmp',
    },
];

export default function LmsKdkmpIndex({ lmsUrl }: Props) {
    return (
        <>
            <Head title="LMS KDKMP" />

            <div className="flex min-h-0 flex-1 flex-col p-4">
                <iframe
                    src={lmsUrl}
                    title="LMS KDKMP"
                    className="min-h-[640px] w-full flex-1 rounded-xl border border-sidebar-border bg-white shadow-sm"
                    allow="clipboard-read; clipboard-write"
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
        </>
    );
}

LmsKdkmpIndex.layout = {
    breadcrumbs,
};
