<?php

namespace App\Http\Requests;

use App\Models\BusinessProcess;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveBusinessProcessRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $businessProcess = $this->route('businessProcess');

        return $businessProcess instanceof BusinessProcess
            ? $this->user()?->can('update', $businessProcess) === true
            : $this->user()?->can('create', BusinessProcess::class) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'unit_name' => ['nullable', 'string', 'max:255'],
            'unit_code' => ['nullable', 'string', 'max:255'],
            'steps' => ['required', 'array', 'size:17'],
            'steps.*.sequence' => ['required', 'integer', 'between:1,17', 'distinct'],
            'steps.*.process_group' => ['required', 'string', 'max:255'],
            'steps.*.detail_process' => ['required', 'string', 'max:5000'],
            'steps.*.pic' => ['required', 'string', 'max:255'],
            'steps.*.standard_time_minutes' => ['required', 'integer', 'min:0', 'max:65535'],
            'steps.*.output_target' => ['nullable', 'string', 'max:5000'],
            'steps.*.responsibility_value' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ];
    }
}
