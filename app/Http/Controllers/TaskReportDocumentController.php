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
}
