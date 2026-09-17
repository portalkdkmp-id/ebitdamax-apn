<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

it('exposes the Kubernetes health endpoint', function () {
    $this->get('/up')->assertSuccessful();
});

it('honors the forwarded protocol from the ingress proxy', function () {
    Route::get('/_test/request-scheme', fn (Request $request): string => $request->getScheme());

    $this->withHeader('X-Forwarded-Proto', 'https')
        ->get('/_test/request-scheme')
        ->assertSuccessful()
        ->assertSeeText('https');
});
