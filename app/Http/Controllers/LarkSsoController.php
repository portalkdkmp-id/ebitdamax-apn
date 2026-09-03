<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Client\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LarkSsoController extends Controller
{
    private const STATE_SESSION_KEY = 'lark_oauth_state';

    private const STATE_TTL_MINUTES = 10;

    public function redirect(Request $request): RedirectResponse
    {
        $configuration = $this->configuration();

        if ($configuration === null) {
            return to_route('login')->with('error', 'Login with Lark belum dikonfigurasi.');
        }

        $state = Str::random(64);

        $request->session()->put(self::STATE_SESSION_KEY, [
            'value' => $state,
            'expires_at' => now()->addMinutes(self::STATE_TTL_MINUTES)->getTimestamp(),
        ]);

        $authorizationUrl = $configuration['authorization_url'].'?'.http_build_query([
            'client_id' => $configuration['app_id'],
            'response_type' => 'code',
            'redirect_uri' => $configuration['redirect_uri'],
            'state' => $state,
            'scope' => $configuration['scopes'],
        ]);

        return redirect()->away($authorizationUrl);
    }

    public function callback(Request $request): RedirectResponse
    {
        $configuration = $this->configuration();

        if ($configuration === null) {
            return $this->failedLogin($request, 'Login with Lark belum dikonfigurasi.');
        }

        if (! $this->hasValidState($request)) {
            return $this->failedLogin($request, 'Sesi login Lark tidak valid atau telah kedaluwarsa.');
        }

        if ($request->filled('error')) {
            return $this->failedLogin($request, 'Login dengan Lark dibatalkan atau ditolak.');
        }

        $code = trim((string) $request->input('code'));

        if ($code === '') {
            return $this->failedLogin($request, 'Lark tidak mengirimkan kode autentikasi.');
        }

        $accessToken = $this->exchangeAuthorizationCode($configuration, $code);

        if ($accessToken === null) {
            return $this->failedLogin($request, 'Autentikasi Lark tidak dapat diverifikasi.');
        }

        $identity = $this->larkIdentity($configuration, $accessToken);

        if ($identity === null) {
            return $this->failedLogin($request, 'Identitas Lark tidak dapat diverifikasi.');
        }

        $user = $this->resolveUser($identity['open_id'], $identity['email']);

        if (! $user instanceof User) {
            return $this->failedLogin(
                $request,
                'Akun Lark Anda belum terhubung ke akun aplikasi. Hubungi superadmin.',
            );
        }

        Auth::login($user);
        $request->session()->regenerate();

        return to_route('dashboard');
    }

    /**
     * @param  array{app_id: string, app_secret: string, authorization_url: string, base_url: string, redirect_uri: string, scopes: string}  $configuration
     */
    private function exchangeAuthorizationCode(array $configuration, string $code): ?string
    {
        $response = Http::acceptJson()
            ->timeout(15)
            ->post($configuration['base_url'].'/open-apis/authen/v2/oauth/token', [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'client_id' => $configuration['app_id'],
                'client_secret' => $configuration['app_secret'],
                'redirect_uri' => $configuration['redirect_uri'],
            ]);

        if (! $this->successfulLarkResponse($response)) {
            Log::warning('Lark OAuth token exchange failed.', [
                'status' => $response->status(),
                'lark_code' => $response->json('code'),
                'lark_message' => $response->json('msg') ?? $response->json('error_description'),
            ]);

            return null;
        }

        $accessToken = $response->json('access_token');

        return is_string($accessToken) && $accessToken !== '' ? $accessToken : null;
    }

    /**
     * @param  array{app_id: string, app_secret: string, authorization_url: string, base_url: string, redirect_uri: string, scopes: string}  $configuration
     * @return array{open_id: string, email: string}|null
     */
    private function larkIdentity(array $configuration, string $accessToken): ?array
    {
        $response = Http::acceptJson()
            ->withToken($accessToken)
            ->timeout(15)
            ->get($configuration['base_url'].'/open-apis/authen/v1/user_info');

        if (! $this->successfulLarkResponse($response)) {
            Log::warning('Lark OAuth user information request failed.', [
                'status' => $response->status(),
                'lark_code' => $response->json('code'),
                'lark_message' => $response->json('msg') ?? $response->json('error_description'),
            ]);

            return null;
        }

        $identity = $response->json('data');

        if (! is_array($identity)) {
            return null;
        }

        $openId = trim((string) ($identity['open_id'] ?? ''));
        $email = $this->normalizedEmail($identity['enterprise_email'] ?? null)
            ?? $this->normalizedEmail($identity['email'] ?? null);

        if ($openId === '' || $email === null) {
            Log::warning('Lark OAuth user information does not contain a usable identity.', [
                'has_open_id' => $openId !== '',
                'has_enterprise_email' => $this->normalizedEmail($identity['enterprise_email'] ?? null) !== null,
                'has_email' => $this->normalizedEmail($identity['email'] ?? null) !== null,
            ]);

            return null;
        }

        return [
            'open_id' => $openId,
            'email' => $email,
        ];
    }

    private function resolveUser(string $larkOpenId, string $email): ?User
    {
        $linkedUser = User::query()->where('lark_open_id', $larkOpenId)->first();

        if ($linkedUser instanceof User) {
            if (Str::lower($linkedUser->email) !== $email) {
                return null;
            }

            $this->markEmailAsVerified($linkedUser);

            return $linkedUser;
        }

        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if (! $user instanceof User || $user->lark_open_id !== null) {
            return null;
        }

        $user->forceFill([
            'lark_open_id' => $larkOpenId,
        ])->save();

        $this->markEmailAsVerified($user);

        return $user;
    }

    private function markEmailAsVerified(User $user): void
    {
        if ($user->email_verified_at !== null) {
            return;
        }

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();
    }

    private function hasValidState(Request $request): bool
    {
        $storedState = $request->session()->pull(self::STATE_SESSION_KEY);
        $state = trim((string) $request->input('state'));

        return is_array($storedState)
            && isset($storedState['value'], $storedState['expires_at'])
            && is_string($storedState['value'])
            && is_numeric($storedState['expires_at'])
            && now()->getTimestamp() <= (int) $storedState['expires_at']
            && $state !== ''
            && hash_equals($storedState['value'], $state);
    }

    /**
     * @return array{app_id: string, app_secret: string, authorization_url: string, base_url: string, redirect_uri: string, scopes: string}|null
     */
    private function configuration(): ?array
    {
        $lark = config('services.lark');

        if (! is_array($lark) || ! ($lark['enabled'] ?? false)) {
            return null;
        }

        $appId = trim((string) ($lark['app_id'] ?? ''));
        $appSecret = trim((string) ($lark['app_secret'] ?? ''));
        $redirectUri = trim((string) ($lark['redirect_uri'] ?? ''));
        $baseUrl = rtrim(trim((string) ($lark['base_url'] ?? '')), '/');
        $authorizationUrl = trim((string) ($lark['authorization_url'] ?? ''));
        $scopes = trim((string) ($lark['scopes'] ?? ''));

        if (
            $appId === ''
            || $appSecret === ''
            || $redirectUri === ''
            || $baseUrl === ''
            || $authorizationUrl === ''
            || $scopes === ''
        ) {
            return null;
        }

        return [
            'app_id' => $appId,
            'app_secret' => $appSecret,
            'authorization_url' => $authorizationUrl,
            'base_url' => $baseUrl,
            'redirect_uri' => $redirectUri,
            'scopes' => $scopes,
        ];
    }

    private function successfulLarkResponse(Response $response): bool
    {
        return $response->successful() && (int) $response->json('code', -1) === 0;
    }

    private function normalizedEmail(mixed $email): ?string
    {
        if (! is_string($email)) {
            return null;
        }

        $email = Str::lower(trim($email));

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }

    private function failedLogin(Request $request, string $message): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('login')->with('error', $message);
    }
}
