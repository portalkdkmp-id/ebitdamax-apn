<?php

namespace App\Http\Middleware;

use App\Models\EbitdamaxKdkmp;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user()?->loadMissing('role');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'role_id' => $user->role_id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'avatar' => $user->avatar ?? null,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'two_factor_enabled' => $user->two_factor_secret !== null,
                    'created_at' => $user->created_at?->toIso8601String(),
                    'updated_at' => $user->updated_at?->toIso8601String(),
                    'can_view_kdkmp_monitoring' => $user->can(
                        'viewMonitoring',
                        EbitdamaxKdkmp::class,
                    ),
                    'role' => $user->role ? [
                        'id' => $user->role->id,
                        'name' => $user->role->name,
                        'slug' => $user->role->slug,
                        'level' => $user->role->level->value,
                        'level_label' => $user->role->level->label(),
                        'domain' => $user->role->domain->value,
                    ] : null,
                ] : null,
            ],
            'flash' => [
                'toast' => $this->toast($request),
            ],
            'notificationCenter' => $user ? [
                'unread_count' => $user->unreadNotifications()->count(),
                'items' => $user->notifications()
                    ->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (DatabaseNotification $notification): array => [
                        'id' => $notification->id,
                        'title' => (string) ($notification->data['title'] ?? 'Pengumuman'),
                        'message' => (string) ($notification->data['message'] ?? ''),
                        'sender_name' => isset($notification->data['sender_name'])
                            ? (string) $notification->data['sender_name']
                            : null,
                        'created_at' => $notification->created_at?->toIso8601String(),
                        'read_at' => $notification->read_at?->toIso8601String(),
                    ])
                    ->values()
                    ->all(),
            ] : [
                'unread_count' => 0,
                'items' => [],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array{type: string, message: string}|null
     */
    private function toast(Request $request): ?array
    {
        if ($message = $request->session()->get('success')) {
            return [
                'type' => 'success',
                'message' => $message,
            ];
        }

        if ($message = $request->session()->get('error')) {
            return [
                'type' => 'error',
                'message' => $message,
            ];
        }

        return null;
    }
}
