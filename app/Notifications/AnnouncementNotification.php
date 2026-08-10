<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class AnnouncementNotification extends Notification
{
    public function __construct(
        public readonly string $title,
        public readonly string $message,
        public readonly string $senderName,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array{title: string, message: string, sender_name: string}
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'sender_name' => $this->senderName,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
