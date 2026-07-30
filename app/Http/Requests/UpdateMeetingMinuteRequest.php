<?php

namespace App\Http\Requests;

use App\Models\MeetingMinute;
use App\Models\MeetingMinuteAttachment;
use App\Models\MeetingMinuteItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateMeetingMinuteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $meetingMinute = $this->route('meeting_minute');

        return $meetingMinute instanceof MeetingMinute
            && $this->user()?->can('update', $meetingMinute) === true;
    }

    public function rules(): array
    {
        $meetingMinute = $this->route('meeting_minute');
        $meetingMinuteId = $meetingMinute instanceof MeetingMinute ? $meetingMinute->id : 0;

        return [
            'title' => ['required', 'string', 'max:255'],
            'meeting_date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:255'],
            'attendees' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.id' => [
                'nullable',
                'integer',
                Rule::exists((new MeetingMinuteItem)->getTable(), 'id')
                    ->where('meeting_minute_id', $meetingMinuteId),
            ],
            'items.*.subject' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.action' => ['nullable', 'string'],
            'items.*.objectives' => ['nullable', 'string'],
            'items.*.date_start' => ['nullable', 'date'],
            'items.*.date_finish' => ['nullable', 'date'],
            'items.*.pic' => ['nullable', 'string', 'max:255'],
            'items.*.status' => ['nullable', 'string', Rule::in(MeetingMinuteItem::STATUSES)],
            'items.*.remarks' => ['nullable', 'string'],
            'documents' => ['nullable', 'array', 'max:10'],
            'documents.*' => [
                File::types([
                    'pdf',
                    'doc',
                    'docx',
                    'xls',
                    'xlsx',
                    'ppt',
                    'pptx',
                    'txt',
                    'csv',
                    'jpg',
                    'jpeg',
                    'png',
                ])->max(10 * 1024),
            ],
            'removed_attachment_ids' => ['nullable', 'array'],
            'removed_attachment_ids.*' => [
                'integer',
                'distinct',
                Rule::exists((new MeetingMinuteAttachment)->getTable(), 'id')
                    ->where('meeting_minute_id', $meetingMinuteId),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.*.id.exists' => 'Item #:position tidak terdaftar pada MoM ini.',
            'items.*.status.in' => 'Status item #:position tidak valid.',
            'removed_attachment_ids.*.exists' => 'Dokumen yang dipilih tidak terdaftar pada MoM ini.',
            'documents.max' => 'Maksimal 10 dokumen dalam satu kali upload.',
            'documents.*.max' => 'Dokumen #:position ditolak karena ukurannya lebih dari 10 MB.',
            'documents.*.mimes' => 'Format dokumen #:position tidak didukung.',
        ];
    }
}
