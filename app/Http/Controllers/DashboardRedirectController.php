<?php

namespace App\Http\Controllers;

use App\Enums\RoleDomain;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardRedirectController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $role = $request->user()?->role;

        if ($role?->level?->value === 'superadmin') {
            return $role->domain === RoleDomain::Kdkmp
                ? to_route('admin.kdkmp-dashboard.index')
                : to_route('admin.dashboard');
        }

        if ($request->user()?->isKdkmpManager()) {
            return to_route('kdkmp-dashboard.index');
        }

        if ($request->user()?->isRegionalManager()) {
            return to_route('admin.kdkmp-dashboard.index');
        }

        if ($role?->domain === RoleDomain::Apn) {
            return to_route('admin.dashboard');
        }

        return to_route('task-dashboard.index');
    }
}
