<?php

namespace App\Models;

use App\Policies\CustomerAnalysisPolicy;
use Database\Factories\CustomerAnalysisFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[UsePolicy(CustomerAnalysisPolicy::class)]
class CustomerAnalysis extends Model
{
    public const OCCUPATION_FARMER = 'farmer';

    public const OCCUPATION_FISHER = 'fisher';

    public const OCCUPATION_RETAIL_CUSTOMER = 'retail_customer';

    public const OCCUPATION_UMKM_OWNER = 'umkm_owner';

    public const OCCUPATION_OTHER = 'other';

    public const GENDER_MALE = 'male';

    public const GENDER_FEMALE = 'female';

    /** @use HasFactory<CustomerAnalysisFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'occupation_role',
        'occupation_other',
        'age',
        'gender',
        'interview_purpose',
        'summary',
        'sentiment',
    ];

    protected $attributes = [
        'sentiment' => 3,
    ];

    protected function casts(): array
    {
        return [
            'age' => 'integer',
            'sentiment' => 'integer',
        ];
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return array<string, string>
     */
    public static function occupationLabels(): array
    {
        return [
            self::OCCUPATION_FARMER => 'Petani',
            self::OCCUPATION_FISHER => 'Nelayan',
            self::OCCUPATION_RETAIL_CUSTOMER => 'Customer Retail',
            self::OCCUPATION_UMKM_OWNER => 'Pemilik Produk UMKM',
            self::OCCUPATION_OTHER => 'Lainnya',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function genderLabels(): array
    {
        return [
            self::GENDER_MALE => 'Laki-laki',
            self::GENDER_FEMALE => 'Perempuan',
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function sentimentLabels(): array
    {
        return [
            1 => 'Negatif',
            2 => 'Cenderung Negatif',
            3 => 'Netral',
            4 => 'Cenderung Positif',
            5 => 'Positif',
        ];
    }

    public function occupationLabel(): string
    {
        if ($this->occupation_role === self::OCCUPATION_OTHER && $this->occupation_other) {
            return $this->occupation_other;
        }

        return self::occupationLabels()[$this->occupation_role] ?? 'Lainnya';
    }

    public function genderLabel(): string
    {
        return self::genderLabels()[$this->gender] ?? '-';
    }

    public function sentimentLabel(): string
    {
        return self::sentimentLabels()[$this->sentiment] ?? 'Netral';
    }
}
