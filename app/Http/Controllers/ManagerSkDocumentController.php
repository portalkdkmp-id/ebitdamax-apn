<?php

namespace App\Http\Controllers;

use App\Actions\StoreManagerSkDocumentAction;
use App\Http\Requests\StoreManagerSkDocumentRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ManagerSkDocumentController extends Controller
{
    public function store(
        StoreManagerSkDocumentRequest $request,
        User $user,
        StoreManagerSkDocumentAction $storeManagerSkDocument,
    ): RedirectResponse {
        $document = $request->file('manager_sk_document');

        abort_unless($document instanceof UploadedFile, 422);

        $storeManagerSkDocument->execute(
            manager: $user,
            document: $document,
            uploadedBy: $request->user(),
        );

        return back()->with('success', 'Dokumen SK Manager berhasil disimpan.');
    }

    public function preview(Request $request, User $user): StreamedResponse
    {
        Gate::authorize('viewManagerSkDocument', $user);

        $document = $user->manager_sk_document;

        abort_unless(
            is_array($document)
            && isset($document['disk'], $document['path'], $document['original_name']),
            404,
        );

        $storage = Storage::disk((string) $document['disk']);
        $path = (string) $document['path'];

        abort_unless($storage->exists($path), 404);

        return $storage->response(
            $path,
            basename((string) $document['original_name']),
            [
                'Content-Type' => 'application/pdf',
                'X-Content-Type-Options' => 'nosniff',
            ],
            'inline',
        );
    }
}
