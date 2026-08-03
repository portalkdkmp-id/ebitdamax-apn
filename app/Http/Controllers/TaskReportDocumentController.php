<?php

namespace App\Http\Controllers;

use App\Models\TaskReport;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskReportDocumentController extends Controller
{
    public function preview(TaskReport $taskReport, string $phase, int $documentIndex): StreamedResponse
    {
        Gate::authorize('view', $taskReport);

        $document = $this->document($taskReport, $phase, $documentIndex);
        $storage = Storage::disk($document['disk']);

        abort_unless($storage->exists($document['path']), 404);

        return $storage->response(
            $document['path'],
            basename($document['original_name']),
            [
                'Content-Type' => $document['mime_type'] ?? 'application/octet-stream',
                'X-Content-Type-Options' => 'nosniff',
            ],
            'inline'
        );
    }

    public function download(TaskReport $taskReport, string $phase, int $documentIndex): StreamedResponse
    {
        Gate::authorize('view', $taskReport);

        $document = $this->document($taskReport, $phase, $documentIndex);
        $storage = Storage::disk($document['disk']);

        abort_unless($storage->exists($document['path']), 404);

        return $storage->download(
            $document['path'],
            basename($document['original_name']),
            ['Content-Type' => $document['mime_type'] ?? 'application/octet-stream']
        );
    }

    public function previewPhoto(TaskReport $taskReport, string $phase): StreamedResponse
    {
        Gate::authorize('view', $taskReport);

        $photo = $this->photo($taskReport, $phase);
        $storage = Storage::disk($photo['disk']);

        abort_unless($storage->exists($photo['path']), 404);

        return $storage->response(
            $photo['path'],
            $photo['original_name'],
            [
                'Content-Type' => $storage->mimeType($photo['path']) ?: 'application/octet-stream',
                'X-Content-Type-Options' => 'nosniff',
            ],
            'inline'
        );
    }

    public function downloadPhoto(TaskReport $taskReport, string $phase): StreamedResponse
    {
        Gate::authorize('view', $taskReport);

        $photo = $this->photo($taskReport, $phase);
        $storage = Storage::disk($photo['disk']);

        abort_unless($storage->exists($photo['path']), 404);

        return $storage->download(
            $photo['path'],
            $photo['original_name'],
            ['Content-Type' => $storage->mimeType($photo['path']) ?: 'application/octet-stream']
        );
    }

    /**
     * @return array{disk: string, path: string, original_name: string, mime_type: string|null, size: int}
     */
    private function document(TaskReport $taskReport, string $phase, int $documentIndex): array
    {
        $documents = match ($phase) {
            'start' => $taskReport->started_documents ?? [],
            'finish' => $taskReport->finished_documents ?? [],
            default => abort(404),
        };

        $document = $documents[$documentIndex] ?? null;

        abort_unless(
            is_array($document)
            && isset($document['disk'], $document['path'], $document['original_name'], $document['size']),
            404
        );

        return [
            'disk' => (string) $document['disk'],
            'path' => (string) $document['path'],
            'original_name' => (string) $document['original_name'],
            'mime_type' => isset($document['mime_type']) ? (string) $document['mime_type'] : null,
            'size' => (int) $document['size'],
        ];
    }

    /**
     * @return array{disk: string, path: string, original_name: string}
     */
    private function photo(TaskReport $taskReport, string $phase): array
    {
        $path = match ($phase) {
            'start' => $taskReport->started_photo,
            'finish' => $taskReport->finished_photo,
            default => abort(404),
        };

        abort_unless(is_string($path) && $path !== '', 404);

        $phaseLabel = $phase === 'start' ? 'mulai' : 'selesai';
        $extension = pathinfo($path, PATHINFO_EXTENSION);

        return [
            'disk' => (string) config('filesystems.default', 'local'),
            'path' => $path,
            'original_name' => "foto-{$phaseLabel}-{$taskReport->uuid}".($extension !== '' ? ".{$extension}" : ''),
        ];
    }
}
