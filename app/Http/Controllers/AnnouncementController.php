<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnnouncementRequest;
use App\Models\Role;
use App\Models\User;
use App\Notifications\AnnouncementNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $roles = Role::query()
            ->withCount('users')
            ->ordered()
            ->get()
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'level' => $role->level->value,
                'level_label' => $role->level->label(),
                'domain' => $role->domain->value,
                'user_count' => $role->users_count,
            ])
            ->values();

        return Inertia::render('Announcements/Index', [
            'roles' => $roles,
        ]);
    }

    public function store(StoreAnnouncementRequest $request): RedirectResponse
    {
        $payload = $request->validated();

        /** @var array<int, int> $roleIds */
        $roleIds = $payload['role_ids'];
        $recipients = User::query()
            ->whereIn('role_id', $roleIds)
            ->get();

        if ($recipients->isEmpty()) {
            return back()->with(
                'error',
                'Tidak ada user yang memiliki role penerima yang dipilih.',
            );
        }

        DB::transaction(function () use ($recipients, $payload, $request): void {
            Notification::send(
                $recipients,
                new AnnouncementNotification(
                    $payload['title'],
                    $payload['message'],
                    $request->user()->name,
                ),
            );
        });

        return redirect()
            ->route('announcements.index')
            ->with(
                'success',
                "Pengumuman berhasil dikirimkan kepada {$recipients->count()} user.",
            );
    }
}
