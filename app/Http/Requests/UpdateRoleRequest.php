<?php

namespace App\Http\Requests;

use App\Enums\RoleDomain;
use App\Enums\RoleLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role')?->id;

        return [
            'domain' => ['required', Rule::enum(RoleDomain::class)],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($roleId),
            ],
            'level' => ['required', Rule::enum(RoleLevel::class)],
        ];
    }
}
