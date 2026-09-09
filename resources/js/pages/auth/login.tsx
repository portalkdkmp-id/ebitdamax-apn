import { Form, Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { h5 as larkH5, redirect as larkRedirect } from '@/routes/auth/lark';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    larkEnabled: boolean;
    larkAppId: string;
    larkScopes: string;
};

type LarkWindow = Window & {
    h5sdk?: { ready: (callback: () => void) => void };
    tt?: {
        requestAccess?: (options: {
            appID: string;
            scopeList: string[];
            success: (result: { code?: string }) => void;
            fail: () => void;
        }) => void;
    };
};

const larkSdkUrl =
    'https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk-1.5.26.js';
const larkAutoLoginKey = 'lark-auto-login-attempted';

export default function Login({
    status,
    canResetPassword,
    larkEnabled,
    larkAppId,
    larkScopes,
}: Props) {
    useEffect(() => {
        if (
            !larkEnabled ||
            !larkAppId ||
            !/(Lark|Feishu)/i.test(navigator.userAgent)
        ) {
            return;
        }

        const requestLogin = () => {
            const { h5sdk, tt } = window as LarkWindow;

            if (
                !h5sdk ||
                !tt?.requestAccess ||
                sessionStorage.getItem(larkAutoLoginKey)
            ) {
                return;
            }

            sessionStorage.setItem(larkAutoLoginKey, 'true');
            h5sdk.ready(() => {
                tt.requestAccess?.({
                    appID: larkAppId,
                    scopeList: larkScopes.split(/\s+/).filter(Boolean),
                    success: ({ code }) => {
                        if (code) {
                            router.post(larkH5.url(), { code });
                        } else {
                            sessionStorage.removeItem(larkAutoLoginKey);
                        }
                    },
                    fail: () => sessionStorage.removeItem(larkAutoLoginKey),
                });
            });
        };

        const existingScript = document.querySelector<HTMLScriptElement>(
            'script[data-lark-h5-sdk]',
        );
        const script = existingScript ?? document.createElement('script');

        script.addEventListener('load', requestLogin);

        if (existingScript) {
            requestLogin();
        } else {
            script.src = larkSdkUrl;
            script.dataset.larkH5Sdk = 'true';
            document.head.appendChild(script);
        }

        return () => script.removeEventListener('load', requestLogin);
    }, [larkAppId, larkEnabled, larkScopes]);

    return (
        <>
            <Head title="Log in" />

            {larkEnabled && (
                <>
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 w-full border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-[#3370ff]/40 hover:bg-[#f5f8ff] hover:text-slate-900"
                    >
                        <a href={larkRedirect.url()} className="relative">
                            <img
                                src="/Lark_Suite_logo_2022.png"
                                alt=""
                                aria-hidden="true"
                                className="absolute left-4 size-6 object-contain"
                            />
                            Login with Lark
                        </a>
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                atau lanjutkan dengan email
                            </span>
                        </div>
                    </div>
                </>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Ingat Kukuh</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
