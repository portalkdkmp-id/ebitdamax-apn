<?php

namespace App\Http\Middleware;

use App\Enums\RoleDomain;
use App\Enums\RoleLevel;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEbitdamaxDomain
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $domain): Response
    {
        $role = $request->user()?->role;
        $requiredDomain = RoleDomain::tryFrom($domain);

        abort_unless($role !== null && $requiredDomain !== null, 403);

        if ($role->level !== RoleLevel::Superadmin) {
            abort_unless($role->domain === $requiredDomain, 403);
        }

        return $next($request);
    }
}
