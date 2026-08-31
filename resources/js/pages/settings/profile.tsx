import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';
import type { ManagerSkDocument } from '@/types/user';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    managerSkDocument,
    status,
}: {
    mustVerifyEmail: boolean;
    managerSkDocument: ManagerSkDocument | null;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    if (!auth.user) {
        return null;
    }

    const user = auth.user;
    const isKdkmpManager = user.role?.slug === 'manager';

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            {isKdkmpManager && (
                <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            Dokumen SK Manager
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Dokumen ini dikelola oleh Superadmin dan hanya dapat
                            Anda lihat.
                        </p>
                    </div>

                    {managerSkDocument ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                                <FileText className="size-5 shrink-0 text-primary" />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {managerSkDocument.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(
                                            managerSkDocument.size /
                                            1024 /
                                            1024
                                        ).toFixed(2)}{' '}
                                        MB
                                    </p>
                                </div>
                            </div>
                            <iframe
                                title="Preview Dokumen SK Manager"
                                src={managerSkDocument.preview_url}
                                className="h-[560px] w-full rounded-lg border bg-muted/20"
                            />
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                            Dokumen SK Manager belum diunggah oleh Superadmin.
                        </div>
                    )}
                </section>
            )}

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
