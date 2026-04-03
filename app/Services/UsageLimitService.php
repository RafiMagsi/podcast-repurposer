<?php

namespace App\Services;

use App\Models\User;

class UsageLimitService
{
    public function summaryForUser(User $user): array
    {
        $limit = max(0, (int) ($user->run_limit ?? 100));
        $used = (int) $user->contentRequests()->count();
        $remaining = max($limit - $used, 0);
        $percentUsed = $limit > 0
            ? min(100, (int) round(($used / $limit) * 100))
            : 100;

        return [
            'limit' => $limit,
            'used' => $used,
            'remaining' => $remaining,
            'reached' => $remaining <= 0,
            'percent_used' => $percentUsed,
            'plan_price_usd' => (float) ($user->plan_price_usd ?? 10),
        ];
    }

    public function hasRemainingRuns(User $user): bool
    {
        return ! $this->summaryForUser($user)['reached'];
    }
}
