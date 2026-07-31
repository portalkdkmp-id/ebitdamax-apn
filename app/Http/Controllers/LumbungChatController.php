<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class LumbungChatController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('LumbungChat/Index', [
            'chatUrl' => (string) config('services.lumbung_kms.chat_url'),
        ]);
    }
}
