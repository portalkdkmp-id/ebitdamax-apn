<?php

namespace App\Console\Commands;

use App\Models\KdkmpOperationalEntry;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;

#[Signature('import:koperasi-operasional {path : Path to the Export_Laporan_Koperasi xlsx file with PO, Receipt, and Sales columns}')]
#[Description('Import/refresh KDKMP operational flags from Excel. Upserts rows only; does not truncate or delete existing data.')]
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
            'nik' => $this->columnFor($headers, ['nik']),
            'nama_kdkmp' => $this->columnFor($headers, ['nama', 'nama_koperasi', 'nama_kdkmp', 'kdkmp']),
            'provinsi' => $this->columnFor($headers, ['provinsi']),
            'kota_kabupaten' => $this->columnFor($headers, ['kota_kabupaten', 'kabupaten_kota']),
            'kecamatan' => $this->columnFor($headers, ['kecamatan']),
            'po' => $this->columnFor($headers, ['po', 'purchase_order', 'dibuatkan_po', 'sudah_dibuatkan_po', 'kdkmp_sudah_dibuatkan_po']),
            'receipt' => $this->columnFor($headers, ['receipt', 'penerimaan_barang', 'sudah_penerimaan_barang', 'sudah_melakukan_penerimaan_barang']),
            'sales' => $this->columnFor($headers, ['sales', 'sale', 'penjualan', 'sudah_penjualan', 'sudah_melakukan_penjualan']),
        ];

        $missingRequiredColumns = collect([
            'Nama KDKMP' => $columns['nama_kdkmp'],
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

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $importedAt = now();

        foreach ($rows as $rowNumber => $row) {
            $nik = $this->stringValue($this->valueAt($row, $columns['nik']));
            $namaKdkmp = $this->stringValue($this->valueAt($row, $columns['nama_kdkmp']));

            if ($nik === '' && $namaKdkmp === '') {
                $skipped++;

                continue;
            }

            $poRaw = $this->stringValue($this->valueAt($row, $columns['po']));
            $receiptRaw = $this->stringValue($this->valueAt($row, $columns['receipt']));
            $salesRaw = $this->stringValue($this->valueAt($row, $columns['sales']));
            $lookup = $nik !== '' ? ['nik' => $nik] : ['nama_kdkmp' => $namaKdkmp];

            $entry = KdkmpOperationalEntry::query()->updateOrCreate(
                $lookup,
                [
                    'nik' => $nik !== '' ? $nik : null,
                    'nama_kdkmp' => $namaKdkmp !== '' ? $namaKdkmp : $nik,
                    'provinsi' => $this->nullableString($this->valueAt($row, $columns['provinsi'])),
                    'kota_kabupaten' => $this->nullableString($this->valueAt($row, $columns['kota_kabupaten'])),
                    'kecamatan' => $this->nullableString($this->valueAt($row, $columns['kecamatan'])),
                    'has_po' => $this->truthyOperationalFlag($poRaw),
                    'has_receipt' => $this->truthyOperationalFlag($receiptRaw),
                    'has_sales' => $this->truthyOperationalFlag($salesRaw),
                    'po_raw' => $poRaw !== '' ? $poRaw : null,
                    'receipt_raw' => $receiptRaw !== '' ? $receiptRaw : null,
                    'sales_raw' => $salesRaw !== '' ? $salesRaw : null,
                    'source_file' => basename($path),
                    'imported_at' => $importedAt,
                    'raw_payload' => [
                        'source_row' => $rowNumber,
                        'source_columns' => [
                            'po' => $columns['po'],
                            'receipt' => $columns['receipt'],
                            'sales' => $columns['sales'],
                        ],
                    ],
                ],
            );

            $entry->wasRecentlyCreated ? $created++ : $updated++;
        }

        $this->info("Imported {$created} new KDKMP operational rows, refreshed {$updated} existing rows, skipped {$skipped} blank rows.");

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

    private function nullableString(mixed $value): ?string
    {
        $string = $this->stringValue($value);

        return $string !== '' ? $string : null;
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
