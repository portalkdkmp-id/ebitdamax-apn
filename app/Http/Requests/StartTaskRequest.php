<?php

namespace App\Http\Requests;

use App\Enums\TaskAdditionalFieldInputType;
use App\Enums\TaskAdditionalFieldShowWhen;
use App\Models\EbitdamaxKdkmp;
use App\Models\Task;
use App\Models\TaskAdditionalField;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StartTaskRequest extends FormRequest
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
        $rules = [
            'started_photo' => ['required', 'image', 'max:3072'],
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
            ...$this->additionalFieldFileRules(),
        ];

        if ($this->user()?->isKdkmpManager()) {
            $rules['member_allocations'] = ['required', 'array'];

            foreach (EbitdamaxKdkmp::OPERATIONAL_ATTENDANCE_ROLES as $key => $label) {
                $rules["member_allocations.{$key}"] = [
                    'required',
                    'integer',
                    'min:0',
                ];
            }
        } else {
            $rules['member_allocations'] = ['prohibited'];
        }

        return $rules;
    }

    /**
     * @return array<string, int>
     */
    public function memberAllocations(): array
    {
        $allocations = $this->validated('member_allocations');

        return EbitdamaxKdkmp::normalizeOperationalAttendance(
            is_array($allocations) ? $allocations : null,
        );
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'documents.max' => 'Maksimal 10 dokumen dalam satu kali upload.',
            'documents.*.max' => 'Dokumen #:position ditolak karena ukurannya lebih dari 10 MB.',
            'documents.*.mimes' => 'Format dokumen #:position tidak didukung.',
            'values.*.max' => 'File tambahan tidak boleh lebih dari 10 MB.',
            'values.*.mimes' => 'Format file tambahan tidak didukung.',
            'values.*.mimetypes' => 'Format file tambahan tidak didukung.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        $attributes = [];

        foreach (EbitdamaxKdkmp::OPERATIONAL_ATTENDANCE_ROLES as $key => $label) {
            $attributes["member_allocations.{$key}"] = "alokasi anggota {$label}";
        }

        foreach ($this->additionalFileFields() as $field) {
            $attributes["values.{$field->field_name}"] = $field->label;
        }

        return $attributes;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function additionalFieldFileRules(): array
    {
        return $this->additionalFileFields()
            ->mapWithKeys(fn (TaskAdditionalField $field): array => [
                "values.{$field->field_name}" => [
                    $field->is_required ? 'required' : 'nullable',
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
            ])
            ->all();
    }

    /**
     * @return Collection<int, TaskAdditionalField>
     */
    private function additionalFileFields(): Collection
    {
        $task = $this->route('task');

        if (! $task instanceof Task) {
            return new Collection;
        }

        return $task->additionalFields()
            ->where('show_when', TaskAdditionalFieldShowWhen::Start->value)
            ->where('input_type', TaskAdditionalFieldInputType::File->value)
            ->get();
    }
}
