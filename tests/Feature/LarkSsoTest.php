<?php

use App\Models\User;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    config()->set('services.lark', [
        'enabled' => true,
        'app_id' => 'cli_test',
        'app_secret' => 'test-secret',
        'redirect_uri' => 'https://ebitdamax.example.test/auth/lark/callback',
        'base_url' => 'https://open.larksuite.com',
        'authorization_url' => 'https://accounts.larksuite.com/open-apis/authen/v1/authorize',
        'scopes' => 'component:user_profile contact:user.email:readonly',
    ]);
});

test('Lark redirect starts an authorization request with a session state', function () {
    $response = $this->get(route('auth.lark.redirect'));

    $response->assertRedirect();

    $redirectUrl = (string) $response->headers->get('Location');
    parse_str((string) parse_url($redirectUrl, PHP_URL_QUERY), $query);

    expect($redirectUrl)->toStartWith('https://accounts.larksuite.com/open-apis/authen/v1/authorize?')
        ->and($query['client_id'])->toBe('cli_test')
        ->and($query['response_type'])->toBe('code')
        ->and($query['redirect_uri'])->toBe('https://ebitdamax.example.test/auth/lark/callback')
        ->and($query['scope'])->toBe('component:user_profile contact:user.email:readonly')
        ->and($query['state'])->not->toBeEmpty();

    $response->assertSessionHas('lark_oauth_state.value', $query['state']);
});

test('Lark callback logs in the local user matched by email and links their open id', function () {
    $user = User::factory()->unverified()->create([
        'email' => 'manager@ebitdamax.local',
    ]);

    Http::fake([
        'https://open.larksuite.com/open-apis/authen/v2/oauth/token' => Http::response([
            'code' => 0,
            'access_token' => 'lark-user-access-token',
        ]),
        'https://open.larksuite.com/open-apis/authen/v1/user_info' => Http::response([
            'code' => 0,
            'data' => [
                'open_id' => 'ou_lark_user',
                'email' => 'MANAGER@EBITDAMAX.LOCAL',
            ],
        ]),
    ]);

    $response = $this
        ->withSession([
            'lark_oauth_state' => [
                'value' => 'valid-state',
                'expires_at' => now()->addMinute()->getTimestamp(),
            ],
        ])
        ->get(route('auth.lark.callback', [
            'code' => 'authorization-code',
            'state' => 'valid-state',
        ]));

    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticatedAs($user);
    expect($user->refresh()->lark_open_id)->toBe('ou_lark_user')
        ->and($user->email_verified_at)->not->toBeNull();

    Http::assertSent(fn (ClientRequest $request): bool => $request->url() === 'https://open.larksuite.com/open-apis/authen/v2/oauth/token'
        && $request->hasHeader('Content-Type', 'application/json')
        && $request->data()['client_id'] === 'cli_test'
        && $request->data()['grant_type'] === 'authorization_code');
});

test('Lark callback rejects an identity without a matching local account', function () {
    Http::fake([
        'https://open.larksuite.com/open-apis/authen/v2/oauth/token' => Http::response([
            'code' => 0,
            'access_token' => 'lark-user-access-token',
        ]),
        'https://open.larksuite.com/open-apis/authen/v1/user_info' => Http::response([
            'code' => 0,
            'data' => [
                'open_id' => 'ou_unknown_user',
                'email' => 'unknown@ebitdamax.local',
            ],
        ]),
    ]);

    $response = $this
        ->withSession([
            'lark_oauth_state' => [
                'value' => 'valid-state',
                'expires_at' => now()->addMinute()->getTimestamp(),
            ],
        ])
        ->get(route('auth.lark.callback', [
            'code' => 'authorization-code',
            'state' => 'valid-state',
        ]));

    $response->assertRedirect(route('login', absolute: false));
    $response->assertSessionHas('error');
    $this->assertGuest();
});
