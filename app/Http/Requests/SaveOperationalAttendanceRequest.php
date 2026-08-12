<?php

namespace App\Http\Requests;

use App\Models\EbitdamaxKdkmp;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveOperationalAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('upsert', EbitdamaxKdkmp::class) === true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'operational_attendance' => ['required', 'array'],
        ];

        foreach (EbitdamaxKdkmp::OPERATIONAL_ATTENDANCE_ROLES as $key => $label) {
            $rules["operational_attendance.{$key}"] = [
                'required',
                'integer',
                'min:0',
            ];
        }

        return $rules;
    }

    /**
     * @return array<string, int>
     */
    public function operationalAttendance(): array
    {
        $attendance = $this->validated('operational_attendance');

        return EbitdamaxKdkmp::normalizeOperationalAttendance(
            is_array($attendance) ? $attendance : null,
        );
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        $attributes = [];

        foreach (EbitdamaxKdkmp::OPERATIONAL_ATTENDANCE_ROLES as $key => $label) {
            $attributes["operational_attendance.{$key}"] = "jumlah anggota {$label}";
        }

        return $attributes;
    }
}
