<?php

namespace App\Console\Commands;

use App\Models\KoperasiSarprasStatusPoint;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;

#[Signature('import:koperasi-operasional {path : Path to the Export_Laporan_Koperasi xlsx file with PO, Receipt, and Sales columns}')]
#[Description('Import/refresh KDKMP operational flags into koperasi_sarpras_status_points. Updates matching NIK only; does not truncate or delete data.')]
class ImportKdkmpOperationalDataCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $path = (string) $this->argument('path');

        if (! file_exists($path)) {
            $this->error("File not found: {$path}");

            return self::FAILURE;
        }

        $sheet = IOFactory::load($path)->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);
        $headerRow = array_shift($rows);

        if (! $headerRow) {
            $this->error('Excel file is empty.');

            return self::FAILURE;
        }

        $headers = $this->headersByName($headerRow);
        $columns = [
            'nik' => $this->columnFor($headers, ['nama_kdkmp', 'nik', 'kdkmp']),
            'po' => $this->columnFor($headers, ['po', 'purchase_order', 'dibuatkan_po', 'sudah_dibuatkan_po', 'kdkmp_sudah_dibuatkan_po']),
            'receipt' => $this->columnFor($headers, ['receipt', 'penerimaan_barang', 'sudah_penerimaan_barang', 'sudah_melakukan_penerimaan_barang']),
            'sales' => $this->columnFor($headers, ['sales', 'sale', 'penjualan', 'sudah_penjualan', 'sudah_melakukan_penjualan']),
        ];

        $missingRequiredColumns = collect([
            'Nama KDKMP / NIK' => $columns['nik'],
            'PO' => $columns['po'],
            'Receipt' => $columns['receipt'],
            'Sales' => $columns['sales'],
        ])
            ->filter(fn (?string $column): bool => $column === null)
            ->keys();

        if ($missingRequiredColumns->isNotEmpty()) {
            $this->error('Kolom wajib tidak ditemukan: '.$missingRequiredColumns->implode(', '));
            $this->line('Header tersedia: '.collect($headerRow)->filter()->implode(', '));

            return self::FAILURE;
        }

        $matchedKdkmp = 0;
        $updatedPoints = 0;
        $unmatchedKdkmp = 0;
        $skipped = 0;
        $updatedAt = now();

        foreach ($rows as $row) {
            $nik = $this->stringValue($this->valueAt($row, $columns['nik']));

            if ($nik === '') {
                $skipped++;

                continue;
            }

            $poRaw = $this->stringValue($this->valueAt($row, $columns['po']));
            $receiptRaw = $this->stringValue($this->valueAt($row, $columns['receipt']));
            $salesRaw = $this->stringValue($this->valueAt($row, $columns['sales']));

            $updated = KoperasiSarprasStatusPoint::query()
                ->where('nik', $nik)
                ->update([
                    'has_po' => $this->truthyOperationalFlag($poRaw),
                    'has_receipt' => $this->truthyOperationalFlag($receiptRaw),
                    'has_sales' => $this->truthyOperationalFlag($salesRaw),
                    'updated_at' => $updatedAt,
                ]);

            if ($updated === 0) {
                $unmatchedKdkmp++;

                continue;
            }

            $matchedKdkmp++;
            $updatedPoints += $updated;
        }

        $this->info("Updated {$updatedPoints} koperasi_sarpras_status_points from {$matchedKdkmp} matching KDKMP rows.");
        $this->info("Skipped {$skipped} blank rows, {$unmatchedKdkmp} KDKMP rows did not match any nik in koperasi_sarpras_status_points.");

        return self::SUCCESS;
    }

    /**
     * @param  array<string, mixed>  $headerRow
     * @return array<string, string>
     */
    private function headersByName(array $headerRow): array
    {
        $headers = [];

        foreach ($headerRow as $column => $header) {
            $normalized = $this->normalizeHeader($header);

            if ($normalized !== '') {
                $headers[$normalized] = $column;
            }
        }

        return $headers;
    }

    /**
     * @param  array<string, string>  $headers
     * @param  array<int, string>  $aliases
     */
    private function columnFor(array $headers, array $aliases): ?string
    {
        foreach ($aliases as $alias) {
            if (isset($headers[$alias])) {
                return $headers[$alias];
            }
        }

        return null;
    }

    private function normalizeHeader(mixed $value): string
    {
        $header = mb_strtolower(trim((string) $value));

        return preg_replace('/[^a-z0-9]+/', '_', $header) ?? '';
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function valueAt(array $row, ?string $column): mixed
    {
        if ($column === null) {
            return null;
        }

        return $row[$column] ?? null;
    }

    private function stringValue(mixed $value): string
    {
        return trim((string) $value);
    }

    private function truthyOperationalFlag(string $value): bool
    {
        $normalized = mb_strtolower(trim($value));

        if ($normalized === '') {
            return false;
        }

        if (is_numeric($normalized)) {
            return (float) $normalized > 0;
        }

        if (in_array($normalized, ['0', 'false', 'no', 'tidak', 'belum', 'belum ada', 'none', '-', 'n/a'], true)) {
            return false;
        }

        return true;
    }
}
