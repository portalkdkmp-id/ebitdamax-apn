<?php

namespace App\Models;

use App\Enums\RegionalScopeLevel;
use Database\Factories\UserRegionalAssignmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRegionalAssignment extends Model
{
    /** @use HasFactory<UserRegionalAssignmentFactory> */
    use HasFactory;

    protected $fillable = [
        'scope_level',
        'provinsi',
        'kota_kabupaten',
        'kecamatan',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scope_level' => RegionalScopeLevel::class,
        ];
    }
}
