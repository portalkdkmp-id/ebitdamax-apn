<?php

namespace App\Http\Controllers;

use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class LmsKdkmpController extends Controller
{
    public function __invoke(): Response
    {
        $baseUrl = rtrim((string) config('services.lms_apn.base_url'), '/');

        $query = http_build_query([
            'email' => auth()->user()->email,
            'expires' => Carbon::now()->addMinutes(5)->getTimestamp(),
        ]);

        $unsignedUrl = $baseUrl.'/auth/ebitdamax-sso?'.$query;

        $signature = hash_hmac(
            'sha256',
            $unsignedUrl,
            (string) config('services.lms_apn.sso_key'),
        );

        return Inertia::render('LmsKdkmp/Index', [
            'lmsUrl' => $unsignedUrl.'&signature='.$signature,
        ]);
    }
}
