<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class UpdateMeetingMinuteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'meeting_date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:255'],
            'attendees' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.id' => ['nullable', 'integer', 'exists:meeting_minute_items,id'],
            'items.*.subject' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.action' => ['nullable', 'string'],
            'items.*.objectives' => ['nullable', 'string'],
            'items.*.date_start' => ['nullable', 'date'],
            'items.*.date_finish' => ['nullable', 'date'],
            'items.*.pic' => ['nullable', 'string', 'max:255'],
            'items.*.status' => ['nullable', 'string', 'max:50'],
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
            'removed_attachment_ids.*' => ['integer', 'distinct', 'exists:meeting_minute_attachments,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'documents.max' => 'Maksimal 10 dokumen dalam satu kali upload.',
            'documents.*.max' => 'Dokumen #:position ditolak karena ukurannya lebih dari 10 MB.',
            'documents.*.mimes' => 'Format dokumen #:position tidak didukung.',
        ];
    }
}
