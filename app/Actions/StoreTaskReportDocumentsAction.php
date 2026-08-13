<?php

namespace App\Actions;

use App\Models\TaskAdditionalField;
use App\Models\TaskReport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

final class StoreTaskReportDocumentsAction
{
    /**
     * @param  array<int, UploadedFile>  $documents
     * @return array<int, array{disk: string, path: string, original_name: string, mime_type: string|null, size: int}>
     */
    public function execute(TaskReport $taskReport, array $documents, string $phase): array
    {
        $this->ensureValidPhase($phase);

        return $this->store(
            documents: $documents,
            directory: "task-reports/{$taskReport->uuid}/{$phase}/documents",
        );
    }

    /**
     * @return array{disk: string, path: string, original_name: string, mime_type: string|null, size: int}
     */
    public function storeAdditionalField(
        TaskReport $taskReport,
        TaskAdditionalField $field,
        UploadedFile $file,
        string $phase,
    ): array {
        $this->ensureValidPhase($phase);

        return $this->store(
            documents: [$file],
            directory: "task-reports/{$taskReport->uuid}/{$phase}/additional-fields/{$field->uuid}",
        )[0];
    }

    private function ensureValidPhase(string $phase): void
    {
        if (! in_array($phase, ['start', 'finish'], true)) {
            throw new InvalidArgumentException('Tahap dokumen task tidak valid.');
        }
    }

    /**
     * @param  array<int, UploadedFile>  $documents
     * @return array<int, array{disk: string, path: string, original_name: string, mime_type: string|null, size: int}>
     */
    private function store(array $documents, string $directory): array
    {

        $disk = (string) config('filesystems.documents_disk', 'local');
        $storedDocuments = [];

        try {
            foreach ($documents as $document) {
                $path = $document->store($directory, $disk);

                if ($path === false) {
                    throw new RuntimeException('Dokumen task gagal disimpan.');
                }

                $mimeType = $document->getMimeType();
                $size = $document->getSize();

                $storedDocuments[] = [
                    'disk' => $disk,
                    'path' => $path,
                    'original_name' => basename($document->getClientOriginalName()),
                    'mime_type' => $mimeType === false ? null : $mimeType,
                    'size' => $size === false ? 0 : $size,
                ];
            }
        } catch (Throwable $exception) {
            foreach ($storedDocuments as $storedDocument) {
                Storage::disk($storedDocument['disk'])->delete($storedDocument['path']);
            }

            throw $exception;
        }

        return $storedDocuments;
    }
}
