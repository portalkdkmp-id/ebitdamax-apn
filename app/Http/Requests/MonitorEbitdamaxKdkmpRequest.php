<?php

namespace App\Http\Requests;

use App\Models\EbitdamaxKdkmp;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\In;

class MonitorEbitdamaxKdkmpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewMonitoring', EbitdamaxKdkmp::class) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => [
                'nullable',
                'date_format:Y-m-d',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $today = Carbon::now((string) config('app.kdkmp_business_timezone'))
                        ->toDateString();

                    if (is_string($value) && $value > $today) {
                        $fail('Tanggal monitoring tidak boleh melewati hari ini.');
                    }
                },
            ],
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', $this->statusRule()],
            'provinsi' => ['nullable', 'string', 'max:255'],
            'kota_kabupaten' => ['nullable', 'string', 'max:255'],
            'kecamatan' => ['nullable', 'string', 'max:255'],
            'desa' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function statusRule(): In
    {
        return Rule::in(['all', 'complete', 'not_filled', 'requires_review']);
    }
}
