<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class ContentActionRateLimit
{
    public function handle(Request $request, Closure $next, string $scope)
    {
        [$maxAttempts, $decaySeconds, $message] = $this->limitConfig($scope);
        $key = $this->throttleKey($request, $scope);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                    'errors' => [
                        'contentRequest' => [$message],
                    ],
                    'retry_after_seconds' => $seconds,
                ], 429);
            }

            return back()->withErrors([
                $this->errorField($scope) => $message,
            ]);
        }

        RateLimiter::hit($key, $decaySeconds);

        return $next($request);
    }

    private function throttleKey(Request $request, string $scope): string
    {
        $userPart = $request->user()?->id ? 'user:' . $request->user()->id : 'ip:' . $request->ip();

        return sprintf('content-rate:%s:%s', $scope, $userPart);
    }

    private function errorField(string $scope): string
    {
        return in_array($scope, ['create', 'suggestions'], true)
            ? 'source_file'
            : 'contentRequest';
    }

    private function limitConfig(string $scope): array
    {
        return match ($scope) {
            'create' => [
                8,
                600,
                'Too many new runs in a short time. Please wait a few minutes before creating another one.',
            ],
            'suggestions' => [
                12,
                600,
                'Too many suggestion requests in a short time. Please wait a few minutes and try again.',
            ],
            'action' => [
                10,
                600,
                'Too many retry or regenerate attempts in a short time. Please wait a few minutes and try again.',
            ],
            default => [
                10,
                600,
                'Too many requests in a short time. Please wait a few minutes and try again.',
            ],
        };
    }
}
