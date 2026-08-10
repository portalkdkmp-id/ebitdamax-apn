<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->limit(100)
            ->get()
            ->map(
                fn (DatabaseNotification $notification): array => $this->transformNotification(
                    $notification,
                ),
            )
            ->values();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(
        Request $request,
        string $notification
    ): RedirectResponse {
        $userNotification = $request->user()
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail();

        if ($userNotification->read_at === null) {
            $userNotification->markAsRead();
        }

        return back();
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()
            ->unreadNotifications()
            ->update(['read_at' => now()]);

        return back();
    }

    /**
     * @return array{id: string, title: string, message: string, sender_name: string|null, created_at: string|null, read_at: string|null}
     */
    private function transformNotification(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'title' => (string) ($notification->data['title'] ?? 'Pengumuman'),
            'message' => (string) ($notification->data['message'] ?? ''),
            'sender_name' => isset($notification->data['sender_name'])
                ? (string) $notification->data['sender_name']
                : null,
            'created_at' => $notification->created_at?->toIso8601String(),
            'read_at' => $notification->read_at?->toIso8601String(),
        ];
    }
}
