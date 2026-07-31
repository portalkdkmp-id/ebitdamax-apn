<?php

namespace App\Http\Controllers;

use App\Enums\RoleLevel;
use App\Http\Requests\UpdateMeetingMinuteItemStatusRequest;
use App\Models\MeetingMinuteItem;
use App\Models\MeetingMinuteItemStatusHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MeetingActionItemController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User, 401);

        $search = trim((string) $request->input('search', ''));
        $requestedStatus = (string) $request->input('status', '');
        $status = in_array($requestedStatus, MeetingMinuteItem::STATUSES, true)
            ? $requestedStatus
            : '';
        $overdue = $request->boolean('overdue');
        $today = today()->toDateString();

        $actionItems = $this->visibleActionItemsQuery($user)
            ->with([
                'meetingMinute:id,title,meeting_date,created_by',
                'meetingMinute.creator:id,name',
                'statusHistories' => function (HasMany $query): void {
                    $query
                        ->with('changedBy:id,name')
                        ->limit(10);
                },
            ])
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $searchQuery) use ($search): void {
                    $searchQuery
                        ->where('subject', 'ilike', "%{$search}%")
                        ->orWhere('action', 'ilike', "%{$search}%")
                        ->orWhere('pic', 'ilike', "%{$search}%")
                        ->orWhereHas('meetingMinute', function (Builder $meetingQuery) use ($search): void {
                            $meetingQuery
                                ->where('title', 'ilike', "%{$search}%")
                                ->orWhereHas('creator', function (Builder $creatorQuery) use ($search): void {
                                    $creatorQuery->where('name', 'ilike', "%{$search}%");
                                });
                        });
                });
            })
            ->when($status !== '', fn (Builder $query): Builder => $query->where('status', $status))
            ->when($overdue, fn (Builder $query): Builder => $query
                ->whereDate('date_finish', '<', $today)
                ->whereIn('status', [
                    MeetingMinuteItem::STATUS_OPEN,
                    MeetingMinuteItem::STATUS_IN_PROGRESS,
                ]))
            ->orderByRaw('date_finish IS NULL')
            ->orderBy('date_finish')
            ->latest('id')
            ->paginate(15)
            ->through(fn (MeetingMinuteItem $actionItem): array => $this->transformActionItem($actionItem, $today))
            ->appends($request->only(['search', 'status', 'overdue']));

        return Inertia::render('MeetingMinutes/ActionItems', [
            'actionItems' => $actionItems,
            'summary' => $this->summary($today, $user),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'overdue' => $overdue,
            ],
        ]);
    }

    public function update(
        UpdateMeetingMinuteItemStatusRequest $request,
        MeetingMinuteItem $meetingMinuteItem
    ): RedirectResponse {
        $actor = $request->user();

        abort_unless($actor instanceof User, 401);

        Gate::authorize('update', $meetingMinuteItem->meetingMinute);

        $status = (string) $request->validated('status');
        $remarks = $request->validated('remarks');

        DB::transaction(function () use ($actor, $meetingMinuteItem, $remarks, $status): void {
            $lockedActionItem = MeetingMinuteItem::query()
                ->whereKey($meetingMinuteItem->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedActionItem->status === $status && $lockedActionItem->remarks === $remarks) {
                throw ValidationException::withMessages([
                    'status' => 'Tidak ada perubahan status atau catatan untuk disimpan.',
                ]);
            }

            $lockedActionItem->statusHistories()->create([
                'from_status' => $lockedActionItem->status,
                'to_status' => $status,
                'note' => $remarks,
                'changed_by' => $actor->id,
                'changed_by_name' => $actor->name,
            ]);

            $lockedActionItem->update([
                'status' => $status,
                'remarks' => $remarks,
            ]);
        });

        return back()->with('success', 'Action item berhasil diperbarui.');
    }

    /**
     * @return array{total: int, open: int, in_progress: int, completed: int, overdue: int}
     */
    private function summary(string $today, User $user): array
    {
        $summary = $this->visibleActionItemsQuery($user)
            ->selectRaw('COUNT(*) AS total_count')
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS open_count', [MeetingMinuteItem::STATUS_OPEN])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS in_progress_count', [MeetingMinuteItem::STATUS_IN_PROGRESS])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS completed_count', [MeetingMinuteItem::STATUS_COMPLETED])
            ->selectRaw(
                'SUM(CASE WHEN date_finish < ? AND status IN (?, ?) THEN 1 ELSE 0 END) AS overdue_count',
                [$today, MeetingMinuteItem::STATUS_OPEN, MeetingMinuteItem::STATUS_IN_PROGRESS]
            )
            ->firstOrFail();

        return [
            'total' => (int) $summary->total_count,
            'open' => (int) $summary->open_count,
            'in_progress' => (int) $summary->in_progress_count,
            'completed' => (int) $summary->completed_count,
            'overdue' => (int) $summary->overdue_count,
        ];
    }

    private function visibleActionItemsQuery(User $user): Builder
    {
        return MeetingMinuteItem::query()
            ->when(
                $user->role?->level !== RoleLevel::Superadmin,
                fn (Builder $query): Builder => $query->whereHas(
                    'meetingMinute',
                    fn (Builder $meetingMinuteQuery): Builder => $meetingMinuteQuery
                        ->whereBelongsTo($user, 'creator')
                )
            );
    }

    /**
     * @return array<string, mixed>
     */
    private function transformActionItem(MeetingMinuteItem $actionItem, string $today): array
    {
        return [
            'id' => $actionItem->id,
            'subject' => $actionItem->subject,
            'action' => $actionItem->action,
            'pic' => $actionItem->pic,
            'date_start' => $actionItem->date_start?->toDateString(),
            'date_finish' => $actionItem->date_finish?->toDateString(),
            'status' => $actionItem->status,
            'remarks' => $actionItem->remarks,
            'is_overdue' => $actionItem->date_finish !== null
                && $actionItem->date_finish->toDateString() < $today
                && in_array($actionItem->status, [
                    MeetingMinuteItem::STATUS_OPEN,
                    MeetingMinuteItem::STATUS_IN_PROGRESS,
                ], true),
            'meeting_minute' => [
                'id' => $actionItem->meetingMinute->id,
                'title' => $actionItem->meetingMinute->title,
                'meeting_date' => $actionItem->meetingMinute->meeting_date?->toDateString(),
                'creator' => $actionItem->meetingMinute->creator ? [
                    'id' => $actionItem->meetingMinute->creator->id,
                    'name' => $actionItem->meetingMinute->creator->name,
                ] : null,
            ],
            'status_histories' => $actionItem->statusHistories
                ->map(fn (MeetingMinuteItemStatusHistory $history): array => [
                    'id' => $history->id,
                    'from_status' => $history->from_status,
                    'to_status' => $history->to_status,
                    'note' => $history->note,
                    'changed_by_name' => $history->changedBy?->name ?? $history->changed_by_name,
                    'created_at' => $history->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }
}
