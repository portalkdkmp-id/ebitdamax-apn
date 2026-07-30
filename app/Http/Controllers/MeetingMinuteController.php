<?php

namespace App\Http\Controllers;

use App\Enums\RoleLevel;
use App\Http\Requests\StoreMeetingMinuteRequest;
use App\Http\Requests\UpdateMeetingMinuteRequest;
use App\Models\MeetingMinute;
use App\Models\MeetingMinuteAttachment;
use App\Models\MeetingMinuteItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class MeetingMinuteController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', MeetingMinute::class);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $canViewAll = $user->role?->level === RoleLevel::Superadmin;
        $search = trim((string) $request->input('search', ''));

        $meetingMinutes = MeetingMinute::query()
            ->with([
                'items' => function (HasMany $query): void {
                    $query->orderBy('sort_order')->orderBy('id');
                },
                'attachments',
                'creator:id,name,username,email',
            ])
            ->when(! $canViewAll, fn (Builder $query): Builder => $query->whereBelongsTo($user, 'creator'))
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $subQuery) use ($search): void {
                    $subQuery
                        ->where('title', 'ilike', "%{$search}%")
                        ->orWhere('location', 'ilike', "%{$search}%")
                        ->orWhere('attendees', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('meeting_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (MeetingMinute $meetingMinute): array => $this->transformMeetingMinute($meetingMinute));

        return Inertia::render('MeetingMinutes/Index', [
            'meetingMinutes' => $meetingMinutes,
            'canViewAll' => $canViewAll,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(StoreMeetingMinuteRequest $request): RedirectResponse
    {
        Gate::authorize('create', MeetingMinute::class);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $storedFiles = [];

        try {
            DB::transaction(function () use ($request, $user, &$storedFiles): void {
                $meetingMinute = MeetingMinute::query()->create([
                    'title' => $request->validated('title'),
                    'meeting_date' => $request->validated('meeting_date'),
                    'start_time' => $request->validated('start_time'),
                    'end_time' => $request->validated('end_time'),
                    'location' => $request->validated('location'),
                    'attendees' => $request->validated('attendees'),
                    'created_by' => $user->id,
                ]);

                $this->syncItems($meetingMinute, $request->validated('items', []));
                $this->storeAttachments(
                    meetingMinute: $meetingMinute,
                    documents: $request->file('documents', []),
                    uploadedBy: $user->id,
                    storedFiles: $storedFiles,
                );
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedFiles);

            throw $exception;
        }

        return back()->with('success', 'Minutes of meeting berhasil disimpan.');
    }

    public function update(UpdateMeetingMinuteRequest $request, MeetingMinute $meetingMinute): RedirectResponse
    {
        Gate::authorize('update', $meetingMinute);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $storedFiles = [];
        $attachmentsToDelete = collect();

        try {
            DB::transaction(function () use ($request, $meetingMinute, $user, &$storedFiles, &$attachmentsToDelete): void {
                $meetingMinute->update([
                    'title' => $request->validated('title'),
                    'meeting_date' => $request->validated('meeting_date'),
                    'start_time' => $request->validated('start_time'),
                    'end_time' => $request->validated('end_time'),
                    'location' => $request->validated('location'),
                    'attendees' => $request->validated('attendees'),
                    'updated_by' => $user->id,
                ]);

                $this->syncItems($meetingMinute, $request->validated('items', []));

                $attachmentsToDelete = $meetingMinute->attachments()
                    ->whereIn('id', $request->validated('removed_attachment_ids', []))
                    ->get();

                $meetingMinute->attachments()
                    ->whereIn('id', $attachmentsToDelete->pluck('id'))
                    ->delete();

                $this->storeAttachments(
                    meetingMinute: $meetingMinute,
                    documents: $request->file('documents', []),
                    uploadedBy: $user->id,
                    storedFiles: $storedFiles,
                );
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedFiles);

            throw $exception;
        }

        $this->deleteAttachmentFiles($attachmentsToDelete->all());

        return back()->with('success', 'Minutes of meeting berhasil diperbarui.');
    }

    public function destroy(MeetingMinute $meetingMinute): RedirectResponse
    {
        Gate::authorize('delete', $meetingMinute);

        $attachments = $meetingMinute->attachments()->get()->all();
        $meetingMinute->delete();
        $this->deleteAttachmentFiles($attachments);

        return back()->with('success', 'Minutes of meeting berhasil dihapus.');
    }

    public function previewAttachment(
        MeetingMinute $meetingMinute,
        MeetingMinuteAttachment $attachment
    ): StreamedResponse {
        Gate::authorize('view', $meetingMinute);
        $this->ensureAttachmentBelongsToMeetingMinute($meetingMinute, $attachment);

        $storage = Storage::disk($attachment->disk);
        abort_unless($storage->exists($attachment->path), 404);

        return $storage->response(
            $attachment->path,
            $attachment->original_name,
            ['Content-Type' => $attachment->mime_type ?? 'application/octet-stream'],
            'inline'
        );
    }

    public function downloadAttachment(
        MeetingMinute $meetingMinute,
        MeetingMinuteAttachment $attachment
    ): StreamedResponse {
        Gate::authorize('view', $meetingMinute);
        $this->ensureAttachmentBelongsToMeetingMinute($meetingMinute, $attachment);

        $storage = Storage::disk($attachment->disk);
        abort_unless($storage->exists($attachment->path), 404);

        return $storage->download(
            $attachment->path,
            $attachment->original_name,
            ['Content-Type' => $attachment->mime_type ?? 'application/octet-stream']
        );
    }

    private function syncItems(MeetingMinute $meetingMinute, array $items): void
    {
        $existingIds = $meetingMinute->items()->pluck('id')->all();
        $incomingIds = array_filter(array_column($items, 'id'), fn ($id) => (int) $id > 0);

        MeetingMinuteItem::query()
            ->where('meeting_minute_id', $meetingMinute->id)
            ->whereNotIn('id', $incomingIds)
            ->delete();

        foreach ($items as $index => $item) {
            $data = [
                'meeting_minute_id' => $meetingMinute->id,
                'subject' => $item['subject'],
                'description' => $item['description'] ?? null,
                'action' => $item['action'] ?? null,
                'objectives' => $item['objectives'] ?? null,
                'date_start' => $item['date_start'] ?? null,
                'date_finish' => $item['date_finish'] ?? null,
                'pic' => $item['pic'] ?? null,
                'status' => $item['status'] ?? 'open',
                'remarks' => $item['remarks'] ?? null,
                'sort_order' => $index,
            ];

            if (! empty($item['id']) && (int) $item['id'] > 0) {
                MeetingMinuteItem::query()
                    ->where('id', (int) $item['id'])
                    ->where('meeting_minute_id', $meetingMinute->id)
                    ->update($data);
            } else {
                MeetingMinuteItem::query()->create($data);
            }
        }
    }

    /**
     * @param  array<int, UploadedFile>  $documents
     * @param  array<int, array{disk: string, path: string}>  $storedFiles
     */
    private function storeAttachments(
        MeetingMinute $meetingMinute,
        array $documents,
        ?int $uploadedBy,
        array &$storedFiles
    ): void {
        $disk = (string) config('filesystems.meeting_minute_attachments_disk', 'local');

        foreach ($documents as $document) {
            $path = $document->store("meeting-minutes/{$meetingMinute->id}", $disk);

            if ($path === false) {
                throw new RuntimeException('Dokumen minutes of meeting gagal disimpan.');
            }

            $storedFiles[] = [
                'disk' => $disk,
                'path' => $path,
            ];

            $meetingMinute->attachments()->create([
                'disk' => $disk,
                'path' => $path,
                'original_name' => basename($document->getClientOriginalName()),
                'mime_type' => $document->getMimeType(),
                'size' => $document->getSize(),
                'uploaded_by' => $uploadedBy,
            ]);
        }
    }

    /**
     * @param  array<int, array{disk: string, path: string}>  $storedFiles
     */
    private function deleteStoredFiles(array $storedFiles): void
    {
        foreach ($storedFiles as $storedFile) {
            Storage::disk($storedFile['disk'])->delete($storedFile['path']);
        }
    }

    /**
     * @param  array<int, MeetingMinuteAttachment>  $attachments
     */
    private function deleteAttachmentFiles(array $attachments): void
    {
        foreach ($attachments as $attachment) {
            Storage::disk($attachment->disk)->delete($attachment->path);
        }
    }

    private function ensureAttachmentBelongsToMeetingMinute(
        MeetingMinute $meetingMinute,
        MeetingMinuteAttachment $attachment
    ): void {
        abort_unless($attachment->meeting_minute_id === $meetingMinute->id, 404);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformMeetingMinute(MeetingMinute $meetingMinute): array
    {
        return [
            'id' => $meetingMinute->id,
            'title' => $meetingMinute->title,
            'meeting_date' => $meetingMinute->meeting_date?->format('Y-m-d'),
            'start_time' => $meetingMinute->start_time,
            'end_time' => $meetingMinute->end_time,
            'location' => $meetingMinute->location,
            'attendees' => $meetingMinute->attendees,
            'creator' => $meetingMinute->creator ? [
                'id' => $meetingMinute->creator->id,
                'name' => $meetingMinute->creator->name,
                'username' => $meetingMinute->creator->username,
                'email' => $meetingMinute->creator->email,
            ] : null,
            'items' => $meetingMinute->items->map(fn (MeetingMinuteItem $item): array => [
                'id' => $item->id,
                'subject' => $item->subject,
                'description' => $item->description,
                'action' => $item->action,
                'objectives' => $item->objectives,
                'date_start' => $item->date_start?->format('Y-m-d'),
                'date_finish' => $item->date_finish?->format('Y-m-d'),
                'pic' => $item->pic,
                'status' => $item->status,
                'remarks' => $item->remarks,
                'sort_order' => $item->sort_order,
            ])->values()->all(),
            'attachments' => $meetingMinute->attachments->map(fn (MeetingMinuteAttachment $attachment): array => [
                'id' => $attachment->id,
                'name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'preview_url' => route('meeting-minutes.attachments.preview', [
                    'meetingMinute' => $meetingMinute,
                    'attachment' => $attachment,
                ], absolute: false),
                'download_url' => route('meeting-minutes.attachments.download', [
                    'meetingMinute' => $meetingMinute,
                    'attachment' => $attachment,
                ], absolute: false),
            ])->values()->all(),
            'created_at' => $meetingMinute->created_at?->toIso8601String(),
            'updated_at' => $meetingMinute->updated_at?->toIso8601String(),
        ];
    }
}
