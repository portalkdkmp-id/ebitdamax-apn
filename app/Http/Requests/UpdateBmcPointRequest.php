<?php

namespace App\Http\Requests;

use App\Models\BmcPoint;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateBmcPointRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $name = $this->input('name');

        if (is_string($name)) {
            $this->merge(['slug' => Str::slug($name)]);
        }
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $bmcPoint = $this->route('bmc_point');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('bmc_points', 'name')->ignore(
                    $bmcPoint instanceof BmcPoint ? $bmcPoint->id : null,
                ),
            ],
            'description' => ['nullable', 'string'],
            'slug' => [
                'required',
                'string',
                Rule::unique('bmc_points', 'slug')->ignore(
                    $bmcPoint instanceof BmcPoint ? $bmcPoint->id : null,
                ),
            ],
        ];
    }
}
