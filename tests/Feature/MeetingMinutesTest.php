<?php

use App\Models\MeetingMinute;
use App\Models\MeetingMinuteItem;

test('guests can visit meeting minutes page while auth middleware is bypassed', function () {
    $response = $this->get('/meeting-minutes');

    $response->assertOk();
});

test('meeting minutes page displays the correct component', function () {
    $response = $this->get('/meeting-minutes');

    $response->assertInertia(fn ($page) => $page->component('MeetingMinutes/Index'));
});

test('store creates a meeting minute with items', function () {
    $this->post('/meeting-minutes', [
        'title' => 'Rapat Pengendalian EBITDA Q3',
        'meeting_date' => '2026-07-20',
        'start_time' => '09:00',
        'end_time' => '11:00',
        'location' => 'Ruang Rapat Utama',
        'attendees' => 'Budi, Ani, Candra',
        'items' => [
            [
                'subject' => 'Review EBITDA',
                'description' => 'Review capaian EBITDA kuartal 3',
                'action' => 'Siapkan data dari finance',
                'objectives' => 'Identifikasi gap vs target',
                'date_start' => '2026-07-21',
                'date_finish' => '2026-07-28',
                'pic' => 'Budi',
                'status' => 'open',
                'remarks' => null,
            ],
        ],
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect(MeetingMinute::query()->count())->toBe(1);
    expect(MeetingMinuteItem::query()->count())->toBe(1);

    $meeting = MeetingMinute::query()->first();
    expect($meeting->title)->toBe('Rapat Pengendalian EBITDA Q3');
    expect($meeting->location)->toBe('Ruang Rapat Utama');

    $item = $meeting->items()->first();
    expect($item->subject)->toBe('Review EBITDA');
    expect($item->status)->toBe('open');
});

test('update modifies meeting minute and syncs items', function () {
    $meeting = MeetingMinute::query()->create([
        'title' => 'Meeting Lama',
        'meeting_date' => '2026-07-15',
        'start_time' => '08:00',
        'end_time' => '10:00',
        'location' => 'Old Room',
        'attendees' => 'A, B',
    ]);

    $item = MeetingMinuteItem::query()->create([
        'meeting_minute_id' => $meeting->id,
        'subject' => 'Old Subject',
        'status' => 'open',
        'sort_order' => 0,
    ]);

    $this->put("/meeting-minutes/{$meeting->id}", [
        'title' => 'Meeting Baru',
        'meeting_date' => '2026-07-20',
        'start_time' => '09:00',
        'end_time' => '11:00',
        'location' => 'Ruang Baru',
        'attendees' => 'A, B, C',
        'items' => [
            [
                'id' => $item->id,
                'subject' => 'Updated Subject',
                'description' => 'Updated desc',
                'action' => 'Updated action',
                'objectives' => 'Updated objectives',
                'date_start' => '2026-07-21',
                'date_finish' => '2026-07-28',
                'pic' => 'Budi',
                'status' => 'in_progress',
                'remarks' => 'Updated remarks',
            ],
        ],
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $meeting->refresh();
    expect($meeting->title)->toBe('Meeting Baru');
    expect($meeting->location)->toBe('Ruang Baru');

    $item->refresh();
    expect($item->subject)->toBe('Updated Subject');
    expect($item->status)->toBe('in_progress');
});

test('destroy deletes meeting minute and its items', function () {
    $meeting = MeetingMinute::query()->create([
        'title' => 'Test Meeting',
        'meeting_date' => '2026-07-15',
    ]);

    MeetingMinuteItem::query()->create([
        'meeting_minute_id' => $meeting->id,
        'subject' => 'Test Item',
        'status' => 'open',
        'sort_order' => 0,
    ]);

    expect(MeetingMinute::query()->count())->toBe(1);
    expect(MeetingMinuteItem::query()->count())->toBe(1);

    $this->delete("/meeting-minutes/{$meeting->id}")
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect(MeetingMinute::query()->count())->toBe(0);
    expect(MeetingMinuteItem::query()->count())->toBe(0);
});

test('search filters meeting minutes by title', function () {
    MeetingMinute::query()->create([
        'title' => 'Rapat EBITDA Q3',
        'meeting_date' => '2026-07-20',
    ]);

    MeetingMinute::query()->create([
        'title' => 'Rapat Operasional',
        'meeting_date' => '2026-07-21',
    ]);

    $response = $this->get('/meeting-minutes?search=EBITDA');
    $response->assertOk();

    $page = $response->inertiaProps();
    expect(count($page['meetingMinutes']))->toBe(1);
    expect($page['meetingMinutes'][0]['title'])->toBe('Rapat EBITDA Q3');
});
