<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRoleLevel
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$levels): Response
    {
        $level = $request->user()?->role?->level?->value;

        abort_unless($level && in_array($level, $levels, true), 403);

        return $next($request);
    }
}
