<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function complete(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User, 401);
        abort_unless($user->isKdkmpManager(), 403);

        $user->forceFill([
            'has_completed_onboarding' => true,
        ])->save();

        return back();
    }
}
