<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class FinishTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');
        $roleId = $this->user()?->role_id;

        return $task instanceof Task
            && $task->is_active
            && $roleId !== null
            && $task->roles()->whereKey($roleId)->exists();
    }

    public function rules(): array
    {
        return [
            'finished_photo' => ['required', 'image', 'max:3072'],
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
            'values' => ['nullable', 'array'],
            'values.*' => ['nullable'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'documents.max' => 'Maksimal 10 dokumen dalam satu kali upload.',
            'documents.*.max' => 'Dokumen #:position ditolak karena ukurannya lebih dari 10 MB.',
            'documents.*.mimes' => 'Format dokumen #:position tidak didukung.',
        ];
    }
}
