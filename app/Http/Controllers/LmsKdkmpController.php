<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LmsKdkmpController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User && $user->isKdkmpManager(), 403);

        return Inertia::render('LmsKdkmp/Index', [
            'learningPathsUrl' => (string) config('services.lms_kdkmp.learning_paths_url'),
        ]);
    }
}
