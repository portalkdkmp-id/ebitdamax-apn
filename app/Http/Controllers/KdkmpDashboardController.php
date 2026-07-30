<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveEbitdamaxKdkmpRequest;
use App\Models\EbitdamaxKdkmp;
use App\Models\SdmKdkmpEntry;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class KdkmpDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewDashboard', EbitdamaxKdkmp::class);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $businessDate = $this->businessDate();
        $sdmKdkmpEntry = $user->sdmKdkmpEntry;

        $todayEntry = $sdmKdkmpEntry
            ? $sdmKdkmpEntry->dailyEbitdaRecords()
                ->whereDate('report_date', $businessDate->toDateString())
                ->first()
            : null;

        $history = EbitdamaxKdkmp::query()
            ->when(
                $sdmKdkmpEntry,
                fn ($query) => $query->where('sdm_kdkmp_entry_id', $sdmKdkmpEntry->id),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->whereDate('report_date', '<', $businessDate->toDateString())
            ->orderByDesc('report_date')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (EbitdamaxKdkmp $entry): array => $this->transformEntry($entry));

        return Inertia::render('KdkmpDashboard/Index', [
            'businessDate' => $businessDate->toDateString(),
            'kdkmp' => $sdmKdkmpEntry
                ? $this->transformKdkmp($sdmKdkmpEntry)
                : null,
            'todayEntry' => $todayEntry
                ? $this->transformEntry($todayEntry)
                : null,
            'history' => $history,
        ]);
    }

    public function upsert(SaveEbitdamaxKdkmpRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->sdm_kdkmp_entry_id !== null, 403);

        $entry = EbitdamaxKdkmp::query()->firstOrNew([
            'sdm_kdkmp_entry_id' => $user->sdm_kdkmp_entry_id,
            'report_date' => $this->businessDate()->toDateString(),
        ]);

        if (! $entry->exists) {
            $entry->created_by = $user->id;
        }

        $payload = ['updated_by' => $user->id];

        foreach (EbitdamaxKdkmp::MANUAL_FIELDS as $field) {
            $payload[$field] = $request->validated($field);
        }

        $entry->fill($payload);
        $entry->save();

        $message = $entry->isComplete()
            ? 'Dashboard harian KDKMP berhasil disimpan lengkap.'
            : 'Draft dashboard harian KDKMP berhasil disimpan.';

        return back()->with('success', $message);
    }

    /**
     * @return array<string, int|float|string|bool|null>
     */
    private function transformEntry(EbitdamaxKdkmp $entry): array
    {
        $data = [
            'id' => $entry->id,
            'report_date' => $entry->report_date?->toDateString(),
            'is_complete' => $entry->isComplete(),
            'updated_at' => $entry->updated_at?->toIso8601String(),
        ];

        foreach (EbitdamaxKdkmp::MANUAL_FIELDS as $field) {
            $data[$field] = $entry->getAttribute($field);
        }

        return $data;
    }

    /**
     * @return array<string, int|string|null>
     */
    private function transformKdkmp(SdmKdkmpEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'nik' => $entry->nik,
            'name' => $entry->nama_koperasi,
            'desa' => $entry->desa,
            'kecamatan' => $entry->kecamatan,
            'kota_kabupaten' => $entry->kota_kabupaten,
            'provinsi' => $entry->provinsi,
        ];
    }

    private function businessDate(): CarbonImmutable
    {
        return CarbonImmutable::now((string) config('app.kdkmp_business_timezone'));
    }
}
