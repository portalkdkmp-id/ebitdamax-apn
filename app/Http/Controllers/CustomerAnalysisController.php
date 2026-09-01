<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerAnalysisRequest;
use App\Http\Requests\UpdateCustomerAnalysisRequest;
use App\Models\CustomerAnalysis;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAnalysisController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', CustomerAnalysis::class);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        return Inertia::render('CustomerAnalysis/Index', [
            'customerAnalyses' => CustomerAnalysis::query()
                ->where('user_id', $user->id)
                ->latest('created_at')
                ->latest('id')
                ->get()
                ->map(fn (CustomerAnalysis $customerAnalysis): array => $this->transform($customerAnalysis))
                ->values()
                ->all(),
            'occupationOptions' => collect(CustomerAnalysis::occupationLabels())
                ->map(fn (string $label, string $value): array => [
                    'value' => $value,
                    'label' => $label,
                ])
                ->values()
                ->all(),
            'sentimentOptions' => collect(CustomerAnalysis::sentimentLabels())
                ->map(fn (string $label, int $value): array => [
                    'value' => $value,
                    'label' => $label,
                ])
                ->values()
                ->all(),
        ]);
    }

    public function store(StoreCustomerAnalysisRequest $request): RedirectResponse
    {
        Gate::authorize('create', CustomerAnalysis::class);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        CustomerAnalysis::query()->create([
            ...$this->payload($request->validated()),
            'user_id' => $user->id,
        ]);

        return back()->with('success', 'Narasumber berhasil ditambahkan.');
    }

    public function update(
        UpdateCustomerAnalysisRequest $request,
        CustomerAnalysis $customerAnalysis
    ): RedirectResponse {
        Gate::authorize('update', $customerAnalysis);

        $customerAnalysis->update($this->payload($request->validated()));

        return back()->with('success', 'Data narasumber berhasil diperbarui.');
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function payload(array $validated): array
    {
        $validated['occupation_other'] = $validated['occupation_role'] === CustomerAnalysis::OCCUPATION_OTHER
            ? $validated['occupation_other']
            : null;

        return $validated;
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(CustomerAnalysis $customerAnalysis): array
    {
        return [
            'id' => $customerAnalysis->id,
            'full_name' => $customerAnalysis->full_name,
            'occupation_role' => $customerAnalysis->occupation_role,
            'occupation_other' => $customerAnalysis->occupation_other,
            'occupation_label' => $customerAnalysis->occupationLabel(),
            'age' => $customerAnalysis->age,
            'gender' => $customerAnalysis->gender,
            'gender_label' => $customerAnalysis->genderLabel(),
            'interview_purpose' => $customerAnalysis->interview_purpose,
            'summary' => $customerAnalysis->summary,
            'sentiment' => $customerAnalysis->sentiment,
            'sentiment_label' => $customerAnalysis->sentimentLabel(),
            'created_at' => $customerAnalysis->created_at?->toIso8601String(),
            'updated_at' => $customerAnalysis->updated_at?->toIso8601String(),
        ];
    }
}
