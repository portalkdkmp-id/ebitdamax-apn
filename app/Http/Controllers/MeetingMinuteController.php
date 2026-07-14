<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMeetingMinuteRequest;
use App\Http\Requests\UpdateMeetingMinuteRequest;
use App\Models\MeetingMinute;
use App\Models\MeetingMinuteItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MeetingMinuteController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        $meetingMinutes = MeetingMinute::query()
            ->with(['items' => function ($query): void {
                $query->orderBy('sort_order')->orderBy('id');
            }])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($subQuery) use ($search): void {
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
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(StoreMeetingMinuteRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $meetingMinute = MeetingMinute::query()->create([
                'title' => $request->validated('title'),
                'meeting_date' => $request->validated('meeting_date'),
                'start_time' => $request->validated('start_time'),
                'end_time' => $request->validated('end_time'),
                'location' => $request->validated('location'),
                'attendees' => $request->validated('attendees'),
                'created_by' => $request->user()?->id,
            ]);

            $this->syncItems($meetingMinute, $request->validated('items', []));
        });

        return back()->with('success', 'Minutes of meeting berhasil disimpan.');
    }

    public function update(UpdateMeetingMinuteRequest $request, MeetingMinute $meetingMinute): RedirectResponse
    {
        DB::transaction(function () use ($request, $meetingMinute): void {
            $meetingMinute->update([
                'title' => $request->validated('title'),
                'meeting_date' => $request->validated('meeting_date'),
                'start_time' => $request->validated('start_time'),
                'end_time' => $request->validated('end_time'),
                'location' => $request->validated('location'),
                'attendees' => $request->validated('attendees'),
                'updated_by' => $request->user()?->id,
            ]);

            $this->syncItems($meetingMinute, $request->validated('items', []));
        });

        return back()->with('success', 'Minutes of meeting berhasil diperbarui.');
    }

    public function destroy(MeetingMinute $meetingMinute): RedirectResponse
    {
        $meetingMinute->delete();

        return back()->with('success', 'Minutes of meeting berhasil dihapus.');
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
            'created_at' => $meetingMinute->created_at?->toIso8601String(),
            'updated_at' => $meetingMinute->updated_at?->toIso8601String(),
        ];
    }
}
