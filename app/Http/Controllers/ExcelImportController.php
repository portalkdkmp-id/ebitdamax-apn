<?php

namespace App\Http\Controllers;

use App\Models\EbitdaValue;
use App\Models\ExcelImport;
use App\Models\ImportErrorLog;
use App\Services\EbitdaExcelParser;
use App\Services\ValueChainJobdeskExcelParser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ExcelImportController extends Controller
{
    public function index(): Response
    {
        $imports = ExcelImport::query()
            ->with(['errors' => function ($query) {
                $query->latest();
            }])
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Import/Index', [
            'imports' => $imports,
        ]);
    }

    public function store(
        Request $request,
        EbitdaExcelParser $parser,
        ValueChainJobdeskExcelParser $valueChainJobdeskParser): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
        ]);

        $file = $validated['file'];
        $year = (int) $validated['year'];

        $disk = 'local';
        $path = $file->store('imports/ebitdamax', $disk);

        if (! is_string($path)) {
            return back()->withErrors([
                'file' => 'Upload gagal: file tidak bisa disimpan di storage aplikasi.',
            ]);
        }

        $excelImport = ExcelImport::query()->create([
            'filename' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'status' => 'processing',
            'created_by' => $request->user()?->id,
        ]);

        try {
            $parsed = $parser->parse(Storage::disk($disk)->path($path), $year);

            DB::transaction(function () use ($parsed, $excelImport) {
                foreach ($parsed['records'] as $record) {
                    EbitdaValue::query()->updateOrCreate(
                        [
                            'organization_id' => $record['organization_id'],
                            'year' => $record['year'],
                            'period_date' => $record['period_date'],
                            'scenario' => $record['scenario'],
                        ],
                        [
                            'excel_import_id' => $excelImport->id,
                            'source_sheet' => $record['source_sheet'],
                            'revenue' => $record['revenue'],
                            'doc_variable' => $record['doc_variable'],
                            'doc_fixed' => $record['doc_fixed'],
                            'ioc' => $record['ioc'],
                            'toc' => $record['toc'],
                            'ebitda' => $record['ebitda'],
                            'ebitda_margin' => $record['ebitda_margin'],
                            'raw_payload' => $record['raw_payload'],
                        ]
                    );
                }

                foreach ($parsed['errors'] as $error) {
                    ImportErrorLog::query()->create([
                        'excel_import_id' => $excelImport->id,
                        'row_number' => $error['row_number'] ?? null,
                        'sheet_name' => $error['sheet_name'] ?? null,
                        'message' => $error['message'],
                        'payload' => $error['payload'] ?? null,
                    ]);
                }

                $excelImport->update([
                    'status' => count($parsed['errors']) > 0 ? 'completed_with_errors' : 'completed',
                    'total_rows' => count($parsed['records']) + count($parsed['errors']),
                    'success_rows' => count($parsed['records']),
                    'failed_rows' => count($parsed['errors']),
                ]);
            });

            return back()->with('success', 'Import Excel EBITDAMAX berhasil diproses.');
        } catch (\Throwable $exception) {
            $excelImport->update([
                'status' => 'failed',
                'failed_rows' => 1,
            ]);

            ImportErrorLog::query()->create([
                'excel_import_id' => $excelImport->id,
                'message' => $exception->getMessage(),
            ]);

            return back()->withErrors([
                'file' => 'Import gagal: '.$exception->getMessage(),
            ]);
        }
    }
}
