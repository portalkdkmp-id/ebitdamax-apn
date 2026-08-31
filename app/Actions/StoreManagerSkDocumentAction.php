<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class StoreManagerSkDocumentAction
{
    /**
     * @return array{disk: string, path: string, original_name: string, mime_type: string, size: int, uploaded_by: int, uploaded_at: string}
     */
    public function execute(User $manager, UploadedFile $document, User $uploadedBy): array
    {
        $disk = (string) config('filesystems.documents_disk', 'local');
        $path = $document->store("manager-sk/{$manager->id}", $disk);

        if ($path === false) {
            throw new RuntimeException('Dokumen SK Manager gagal disimpan.');
        }

        $metadata = [
            'disk' => $disk,
            'path' => $path,
            'original_name' => basename($document->getClientOriginalName()),
            'mime_type' => 'application/pdf',
            'size' => $document->getSize() ?: 0,
            'uploaded_by' => $uploadedBy->id,
            'uploaded_at' => now()->toIso8601String(),
        ];
        $previousDocument = $manager->manager_sk_document;

        try {
            DB::transaction(function () use ($manager, $metadata): void {
                $manager->forceFill([
                    'manager_sk_document' => $metadata,
                ])->save();
            });
        } catch (Throwable $exception) {
            Storage::disk($disk)->delete($path);

            throw $exception;
        }

        $this->deletePreviousDocument($previousDocument);

        return $metadata;
    }

    /**
     * @param  array<string, mixed>|null  $document
     */
    private function deletePreviousDocument(?array $document): void
    {
        if (
            ! is_array($document)
            || ! isset($document['disk'], $document['path'])
            || ! is_string($document['disk'])
            || ! is_string($document['path'])
        ) {
            return;
        }

        Storage::disk($document['disk'])->delete($document['path']);
    }
}
