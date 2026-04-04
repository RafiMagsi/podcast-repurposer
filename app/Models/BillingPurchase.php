<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'provider',
        'provider_session_id',
        'provider_payment_status',
        'status',
        'currency',
        'amount_cents',
        'runs_purchased',
        'payload',
        'fulfilled_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'runs_purchased' => 'integer',
            'payload' => 'array',
            'fulfilled_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
