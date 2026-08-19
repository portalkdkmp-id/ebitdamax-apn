<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBmcPointRequest;
use App\Http\Requests\UpdateBmcPointRequest;
use App\Models\BmcPoint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class BmcPointController extends Controller
{
    public function store(StoreBmcPointRequest $request): RedirectResponse
    {
        BmcPoint::query()->create($this->payload($request->validated()));

        return back()->with('success', 'Poin BMC berhasil ditambahkan.');
    }

    public function update(
        UpdateBmcPointRequest $request,
        BmcPoint $bmcPoint,
    ): RedirectResponse {
        $bmcPoint->update($this->payload($request->validated()));

        return back()->with('success', 'Poin BMC berhasil diperbarui.');
    }

    public function destroy(BmcPoint $bmcPoint): RedirectResponse
    {
        if ($bmcPoint->tasks()->exists() || $bmcPoint->dailySelections()->exists()) {
            return back()->with(
                'error',
                'Poin BMC tidak dapat dihapus karena sudah digunakan oleh task atau riwayat pilihan harian.',
            );
        }

        $bmcPoint->delete();

        return back()->with('success', 'Poin BMC berhasil dihapus.');
    }

    /**
     * @param  array{name: string, description?: string|null}  $payload
     * @return array{name: string, slug: string, description: string|null}
     */
    private function payload(array $payload): array
    {
        return [
            'name' => $payload['name'],
            'slug' => Str::slug($payload['name']),
            'description' => $payload['description'] ?? null,
        ];
    }
}
