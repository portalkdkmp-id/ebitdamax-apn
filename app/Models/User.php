<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property int|null $role_id
 * @property int|null $sdm_kdkmp_entry_id
 * @property string $name
 * @property string|null $username
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['role_id', 'sdm_kdkmp_entry_id', 'name', 'username', 'email', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    public const EMAIL_KDKMP_GERAI = 'kdkmp.gerai@ebitdamax.local';

    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected static function booted(): void
    {
        static::saving(function (User $user): void {
            if ($user->isDirty('name') || ! $user->username) {
                $user->username = self::uniqueUsername($user->name, $user->id);
            }
        });
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function sdmKdkmpEntry(): BelongsTo
    {
        return $this->belongsTo(SdmKdkmpEntry::class);
    }

    public function businessProcesses(): HasMany
    {
        return $this->hasMany(BusinessProcess::class);
    }

    public function unitCostAssumptions(): HasMany
    {
        return $this->hasMany(UnitCostAssumption::class);
    }

    public function revenuePlans(): HasMany
    {
        return $this->hasMany(RevenuePlan::class);
    }

    public function planEbitdaMatrices(): HasMany
    {
        return $this->hasMany(PlanEbitdaMatrix::class);
    }

    public function isEbitdaKdkmp(): bool
    {
        return $this->role?->slug === Role::SLUG_EBITDA_KDKMP;
    }

    public function isKdkmpManager(): bool
    {
        return $this->role?->slug === Role::SLUG_KDKMP_MANAGER;
    }

    public function getRouteKeyName(): string
    {
        return 'username';
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    private static function uniqueUsername(string $name, ?int $ignoreUserId = null): string
    {
        $baseUsername = Str::slug($name) ?: Str::random(8);
        $username = $baseUsername;
        $suffix = 2;

        while (self::query()
            ->where('username', $username)
            ->when($ignoreUserId !== null, fn ($query) => $query->whereKeyNot($ignoreUserId))
            ->exists()
        ) {
            $username = $baseUsername.'-'.$suffix;
            $suffix++;
        }

        return $username;
    }
}
