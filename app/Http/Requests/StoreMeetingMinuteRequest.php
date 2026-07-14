<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMeetingMinuteRequest extends FormRequest
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
            'items.*.subject' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.action' => ['nullable', 'string'],
            'items.*.objectives' => ['nullable', 'string'],
            'items.*.date_start' => ['nullable', 'date'],
            'items.*.date_finish' => ['nullable', 'date'],
            'items.*.pic' => ['nullable', 'string', 'max:255'],
            'items.*.status' => ['nullable', 'string', 'max:50'],
            'items.*.remarks' => ['nullable', 'string'],
        ];
    }
}
