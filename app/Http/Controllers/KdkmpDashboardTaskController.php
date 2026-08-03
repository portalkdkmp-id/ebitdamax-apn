<?php

namespace App\Http\Controllers;

use App\Enums\TaskReportStatus;
use App\Models\Role;
use App\Models\SdmKdkmpEntry;
use App\Models\TaskReport;
use App\Models\TaskReportValue;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KdkmpDashboardTaskController extends Controller
{
    public function index(Request $request, SdmKdkmpEntry $kdkmpEntry, string $date): Response
    {
        $managerUser = $kdkmpEntry->managerUser;

        $reports = collect();

        if ($managerUser) {
            // Kita ambil task report milik managerUser di mana period_key sama dengan date, ATAU diselesaikan pada tanggal tersebut.
            $reports = TaskReport::query()
                ->with(['task.taskCategory', 'task.roles', 'values.additionalField'])
                ->where('user_id', $managerUser->id)
                ->where('status', TaskReportStatus::Completed->value)
                ->where(function ($query) use ($date) {
                    $query->where('period_key', $date)
                        ->orWhereDate('finished_at', $date)
                        ->orWhereDate('started_at', $date);
                })
                ->latest('finished_at')
                ->get()
                ->map(fn (TaskReport $report): array => [
                    'id' => $report->id,
                    'uuid' => $report->uuid,
                    'started_at' => $report->started_at?->toIso8601String(),
                    'finished_at' => $report->finished_at?->toIso8601String(),
                    'duration_minutes' => $report->duration_minutes,
                    'status_label' => $report->status->label(),
                    'photos' => $this->transformPhotos($report),
                    'documents' => $this->transformDocuments($report),
                    'values' => $this->transformValues($report),
                    'task' => [
                        'id' => $report->task->id,
                        'uuid' => $report->task->uuid,
                        'name' => $report->task->name,
                        'description' => $report->task->description,
                        'time_require' => $report->task->time_require,
                        'lower_time_threshold_minutes' => $report->task->lower_time_threshold_minutes,
                        'upper_time_threshold_minutes' => $report->task->upper_time_threshold_minutes,
                        'task_category' => [
                            'id' => $report->task->taskCategory->id,
                            'name' => $report->task->taskCategory->name,
                            'slug' => $report->task->taskCategory->slug,
                        ],
                        'roles' => $report->task->roles
                            ->map(fn (Role $role): array => [
                                'id' => $role->id,
                                'name' => $role->name,
                                'slug' => $role->slug,
                                'level' => $role->level->value,
                                'level_label' => $role->level->label(),
                            ])
                            ->values()
                            ->all(),
                    ],
                ]);
        }

        return Inertia::render('KdkmpDashboard/TaskReports', [
            'kdkmpEntry' => [
                'id' => $kdkmpEntry->id,
                'name' => $kdkmpEntry->nama_koperasi,
                'manager' => $managerUser ? [
                    'name' => $managerUser->name,
                    'email' => $managerUser->email,
                ] : null,
            ],
            'date' => $date,
            'reports' => $reports,
        ]);
    }

    /**
     * @return array<int, array{phase: string, phase_label: string, name: string, preview_url: string, download_url: string}>
     */
    private function transformPhotos(TaskReport $taskReport): array
    {
        return collect([
            'start' => $taskReport->started_photo,
            'finish' => $taskReport->finished_photo,
        ])->map(function (?string $path, string $phase) use ($taskReport): ?array {
            if (! $path) {
                return null;
            }

            $phaseLabel = $phase === 'start' ? 'Mulai' : 'Selesai';
            $extension = pathinfo($path, PATHINFO_EXTENSION);
            $name = "Foto {$phaseLabel}".($extension !== '' ? ".{$extension}" : '');
            $routeParameters = [
                'taskReport' => $taskReport,
                'phase' => $phase,
            ];

            return [
                'phase' => $phase,
                'phase_label' => $phaseLabel,
                'name' => $name,
                'preview_url' => route(
                    'task-reports.photos.preview',
                    $routeParameters,
                    absolute: false
                ),
                'download_url' => route(
                    'task-reports.photos.download',
                    $routeParameters,
                    absolute: false
                ),
            ];
        })->filter()->values()->all();
    }

    /**
     * @return array<int, array{phase: string, phase_label: string, name: string, mime_type: string|null, size: int, preview_url: string, download_url: string}>
     */
    private function transformDocuments(TaskReport $taskReport): array
    {
        return collect([
            'start' => $taskReport->started_documents ?? [],
            'finish' => $taskReport->finished_documents ?? [],
        ])->flatMap(function (array $documents, string $phase) use ($taskReport): array {
            return collect($documents)
                ->map(function (mixed $document, int $documentIndex) use ($taskReport, $phase): ?array {
                    if (! is_array($document) || ! isset($document['original_name'], $document['size'])) {
                        return null;
                    }

                    $routeParameters = [
                        'taskReport' => $taskReport,
                        'phase' => $phase,
                        'documentIndex' => $documentIndex,
                    ];

                    return [
                        'phase' => $phase,
                        'phase_label' => $phase === 'start' ? 'Mulai' : 'Selesai',
                        'name' => (string) $document['original_name'],
                        'mime_type' => isset($document['mime_type']) ? (string) $document['mime_type'] : null,
                        'size' => (int) $document['size'],
                        'preview_url' => route(
                            'task-reports.documents.preview',
                            $routeParameters,
                            absolute: false
                        ),
                        'download_url' => route(
                            'task-reports.documents.download',
                            $routeParameters,
                            absolute: false
                        ),
                    ];
                })
                ->filter()
                ->values()
                ->all();
        })->values()->all();
    }

    /**
     * @return array<int, array{phase: string, phase_label: string, label: string, value: string|null}>
     */
    private function transformValues(TaskReport $taskReport): array
    {
        return $taskReport->values
            ->filter(fn (TaskReportValue $value): bool => $value->additionalField !== null)
            ->sortBy(fn (TaskReportValue $value): array => [
                $value->additionalField->show_when->value,
                $value->additionalField->sort_order,
                $value->id,
            ])
            ->map(fn (TaskReportValue $value): array => [
                'phase' => $value->additionalField->show_when->value,
                'phase_label' => $value->additionalField->show_when->label(),
                'label' => $value->additionalField->label,
                'value' => $value->value,
            ])
            ->values()
            ->all();
    }
}
