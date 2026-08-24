<?php

namespace App\Http\Requests;

use App\Models\EbitdamaxKdkmp;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class ViewKdkmpDashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewDashboard', EbitdamaxKdkmp::class) === true;
    }

    /**
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
                        $fail('Tanggal grafik tidak boleh melewati hari ini.');
                    }
                },
            ],
        ];
    }
}
