<?php

namespace App\Services;

use App\Models\ContentRequest;
use App\Models\OperationalEvent;
use Illuminate\Support\Facades\Log;
use Throwable;

class OperationalAnalyticsService
{
    public function record(string $eventType, array $attributes = []): void
    {
        try {
            OperationalEvent::create([
                'event_type' => $eventType,
                'user_id' => $attributes['user_id'] ?? null,
                'content_request_id' => $attributes['content_request_id'] ?? null,
                'source_type' => $attributes['source_type'] ?? null,
                'content_type' => $attributes['content_type'] ?? null,
                'status' => $attributes['status'] ?? null,
                'meta' => $attributes['meta'] ?? null,
            ]);
        } catch (Throwable $e) {
            report($e);

            Log::warning('Operational analytics event could not be recorded', [
                'event_type' => $eventType,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function summary(): array
    {
        $sourceTypeUsage = OperationalEvent::query()
            ->selectRaw('source_type, COUNT(*) as aggregate')
            ->where('event_type', 'run_created')
            ->whereNotNull('source_type')
            ->groupBy('source_type')
            ->pluck('aggregate', 'source_type')
            ->all();

        $totalRuns = ContentRequest::query()->count();
        $completedRuns = ContentRequest::query()->where('status', ContentRequest::STATUS_COMPLETED)->count();
        $failedRuns = ContentRequest::query()->where('status', ContentRequest::STATUS_FAILED)->count();
        $partialRuns = ContentRequest::query()->where('status', ContentRequest::STATUS_PARTIAL)->count();

        $actionUsage = OperationalEvent::query()
            ->selectRaw('event_type, COUNT(*) as aggregate')
            ->whereIn('event_type', ['retry_transcription', 'regenerate_content'])
            ->groupBy('event_type')
            ->pluck('aggregate', 'event_type')
            ->all();

        $outputUsage = OperationalEvent::query()
            ->selectRaw('content_type, COUNT(*) as aggregate')
            ->where('event_type', 'output_generated')
            ->whereNotNull('content_type')
            ->groupBy('content_type')
            ->orderByDesc('aggregate')
            ->get()
            ->map(fn ($row) => [
                'content_type' => $row->content_type,
                'count' => (int) $row->aggregate,
            ])
            ->values()
            ->all();

        return [
            'source_type_usage' => [
                'video' => (int) ($sourceTypeUsage['video'] ?? 0),
                'audio' => (int) ($sourceTypeUsage['audio'] ?? 0),
                'text' => (int) ($sourceTypeUsage['text'] ?? 0),
            ],
            'run_outcomes' => [
                'total' => $totalRuns,
                'completed' => $completedRuns,
                'failed' => $failedRuns,
                'partial' => $partialRuns,
                'completion_rate' => $this->rate($completedRuns, $totalRuns),
                'failure_rate' => $this->rate($failedRuns, $totalRuns),
            ],
            'actions' => [
                'retry_transcription' => (int) ($actionUsage['retry_transcription'] ?? 0),
                'regenerate_content' => (int) ($actionUsage['regenerate_content'] ?? 0),
            ],
            'most_used_output_types' => $outputUsage,
        ];
    }

    private function rate(int $count, int $total): float
    {
        if ($total === 0) {
            return 0.0;
        }

        return round(($count / $total) * 100, 1);
    }
}
