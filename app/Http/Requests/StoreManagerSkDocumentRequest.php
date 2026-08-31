<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreManagerSkDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $manager = $this->route('user');

        return $manager instanceof User
            && $this->user()?->can('uploadManagerSkDocument', $manager) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'manager_sk_document' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'manager_sk_document.required' => 'Dokumen SK Manager wajib dipilih.',
            'manager_sk_document.mimes' => 'Dokumen SK Manager harus berupa file PDF.',
            'manager_sk_document.max' => 'Ukuran dokumen SK Manager maksimal 10 MB.',
        ];
    }
}
