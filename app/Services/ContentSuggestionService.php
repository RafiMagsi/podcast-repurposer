<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class ContentSuggestionService
{
    public function __construct(
        protected SettingService $settings
    ) {
    }

    public function generate(string $title, string $tone, ?string $sourceType = null, ?string $sourceText = null): array
    {
        $title = trim($title);
        $sourceType = trim((string) $sourceType);
        $sourceText = trim((string) $sourceText);

        $shouldBypass = filter_var(
            (string) $this->settings->get('bypass_openai_for_testing', 'false'),
            FILTER_VALIDATE_BOOL
        );

        if ($shouldBypass) {
            return $this->mockSuggestions($title, $tone, $sourceType, $sourceText);
        }

        $apiKey = $this->settings->get('openai_api_key');

        if (! $apiKey) {
            throw new RuntimeException('Missing openai_api_key');
        }

        $seedText = $sourceText !== ''
            ? mb_substr($sourceText, 0, 220)
            : 'No raw text was provided yet. Base the suggestions on the title and source type.';

        $prompt = <<<PROMPT
Return only valid JSON.

Do not add markdown.
Do not wrap in backticks.
Do not add explanations.

Generate exactly 3 sharp content directions for VoicePost AI.

Inputs:
- Title: {$title}
- Tone: {$tone}
- Source type: {$sourceType}
- Source seed: {$seedText}

Rules:
- Each suggestion must be one sentence
- Each suggestion must be 12 to 24 words
- Keep them distinct
- Make them practical for summary + social outputs
- Stay faithful to the title and source seed
- Do not number them

Return exactly this JSON shape:
{
  "suggestions": ["string", "string", "string"]
}
PROMPT;

        $response = Http::withToken($apiKey)
            ->timeout(45)
            ->connectTimeout(15)
            ->post('https://api.openai.com/v1/responses', [
                'model' => 'gpt-4o-mini',
                'max_output_tokens' => 180,
                'input' => $prompt,
            ]);

        Log::info('ContentSuggestionService response received', [
            'status' => $response->status(),
            'source_type' => $sourceType,
            'has_source_text' => $sourceText !== '',
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Suggestion generation failed: ' . $response->body());
        }

        $text = $this->extractTextFromResponse($response->json());

        if (! $text) {
            throw new RuntimeException('Suggestion generation returned empty text.');
        }

        $decoded = json_decode($this->sanitizeJsonText($text), true);

        if (! is_array($decoded) || ! isset($decoded['suggestions']) || ! is_array($decoded['suggestions'])) {
            throw new RuntimeException('Suggestion generation returned invalid JSON.');
        }

        $suggestions = collect($decoded['suggestions'])
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->unique()
            ->values()
            ->take(3)
            ->all();

        if (count($suggestions) !== 3) {
            throw new RuntimeException('Suggestion generation did not return exactly 3 valid suggestions.');
        }

        return $suggestions;
    }

    protected function mockSuggestions(string $title, string $tone, string $sourceType, string $sourceText): array
    {
        $base = $sourceText !== ''
            ? mb_substr($sourceText, 0, 90)
            : $title;

        return [
            "Lead with the clearest lesson from {$base} and frame it in a {$tone} voice for quick social reuse.",
            "Turn {$base} into a practical takeaway post with one memorable insight and one strong next step.",
            "Use {$base} as the central hook, then shape the outputs around one specific problem, result, or opinion.",
        ];
    }

    protected function extractTextFromResponse(array $json): ?string
    {
        $text = data_get($json, 'output_text');

        if ($text) {
            return $text;
        }

        $output = data_get($json, 'output', []);

        if (! is_array($output)) {
            return null;
        }

        $parts = [];

        foreach ($output as $item) {
            $content = $item['content'] ?? [];

            if (! is_array($content)) {
                continue;
            }

            foreach ($content as $block) {
                if (($block['type'] ?? null) === 'output_text' && isset($block['text'])) {
                    $parts[] = $block['text'];
                }
            }
        }

        $combined = trim(implode("\n", $parts));

        return $combined !== '' ? $combined : null;
    }

    protected function sanitizeJsonText(string $text): string
    {
        $text = trim($text);
        $text = preg_replace('/^```json\s*/i', '', $text);
        $text = preg_replace('/^```\s*/', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);

        return trim($text);
    }
}
