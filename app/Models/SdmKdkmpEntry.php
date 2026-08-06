<?php

namespace App\Models;

use App\Enums\RegionalScopeLevel;
use App\Enums\RoleLevel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SdmKdkmpEntry extends Model
{
    public const REGION_FIELDS = [
        'provinsi',
        'kota_kabupaten',
        'kecamatan',
        'desa',
    ];

    protected $fillable = [
        'nik',
        'nama_koperasi',
        'provinsi',
        'nama_kodam',
        'nama_korem',
        'nama_kodim',
        'desa',
        'kecamatan',
        'kota_kabupaten',
        'batch',
        'jumlah_karyawan',
        'catatan',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'jumlah_karyawan' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function managerUser(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function dailyEbitdaRecords(): HasMany
    {
        return $this->hasMany(EbitdamaxKdkmp::class);
    }

    /**
     * @param  array{provinsi?: string|null, kota_kabupaten?: string|null, kecamatan?: string|null, desa?: string|null}  $filters
     */
    public function scopeForRegions(Builder $query, array $filters): Builder
    {
        foreach (self::REGION_FIELDS as $field) {
            $value = $filters[$field] ?? null;

            if (! is_string($value) || $value === '') {
                continue;
            }

            $query->where($field, $value);
        }

        return $query;
    }

    public function scopeAccessibleBy(Builder $query, User $user): Builder
    {
        if ($user->role?->level === RoleLevel::Superadmin) {
            return $query;
        }

        $assignments = $user->relationLoaded('regionalAssignments')
            ? $user->regionalAssignments
            : $user->regionalAssignments()->get();
        $hasOwnKdkmp = $user->sdm_kdkmp_entry_id !== null;

        if (! $hasOwnKdkmp && $assignments->isEmpty()) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $accessibleQuery) use ($assignments, $hasOwnKdkmp, $user): void {
            if ($hasOwnKdkmp) {
                $accessibleQuery->orWhereKey($user->sdm_kdkmp_entry_id);
            }

            foreach ($assignments as $assignment) {
                $accessibleQuery->orWhere(function (Builder $assignmentQuery) use ($assignment): void {
                    $assignmentQuery->where('provinsi', $assignment->provinsi);

                    if ($assignment->scope_level !== RegionalScopeLevel::Province) {
                        $assignmentQuery->where('kota_kabupaten', $assignment->kota_kabupaten);
                    }

                    if ($assignment->scope_level === RegionalScopeLevel::District) {
                        $assignmentQuery->where('kecamatan', $assignment->kecamatan);
                    }
                });
            }
        });
    }
}
