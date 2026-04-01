<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class OpenAIContentService
{
    public function __construct(
        protected SettingService $settings
    ) {
    }

    public function generate(string $transcript, string $tone = 'professional'): array
    {
        $apiKey = $this->settings->get('openai_api_key');

        if (! $apiKey) {
            throw new RuntimeException('Missing openai_api_key');
        }

        $cleanTranscript = $this->cleanTranscript($transcript);

        Log::info('OpenAIContentService started', [
            'original_length' => strlen($transcript),
            'clean_length' => strlen($cleanTranscript),
            'tone' => $tone,
        ]);

        $source = strlen($cleanTranscript) > 12000
            ? $this->createCompactNotes($apiKey, $cleanTranscript)
            : $cleanTranscript;

        Log::info('VoicePost source prepared', [
            'source_length' => strlen($source),
            'used_notes' => strlen($cleanTranscript) > 12000,
        ]);

        return $this->generateOutputs($apiKey, $source, $tone);
    }

    protected function cleanTranscript(string $transcript): string
    {
        $text = trim($transcript);
        $text = preg_replace('/\b\d{1,2}:\d{2}(?::\d{2})?\b/', ' ', $text);
        $text = preg_replace('/\b(?:speaker\s*\d+|host|guest|interviewer|interviewee)\s*:/i', ' ', $text);
        $text = preg_replace('/\b(um|uh|you know|like)\b[\s,]*/i', ' ', $text);
        $text = preg_replace('/\s+/', ' ', $text);

        return trim($text);
    }

    protected function createCompactNotes(string $apiKey, string $transcript): string
    {
        $prompt = <<<PROMPT
Compress this short voice-note transcript into compact notes for social content generation.

Rules:
- Keep the core idea, key facts, and strongest takeaways
- Remove filler and repetition
- Maximum 10 bullets
- Keep it dense and short
- Do not add commentary

Transcript:
{$transcript}
PROMPT;

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->connectTimeout(15)
            ->post('https://api.openai.com/v1/responses', [
                'model' => 'gpt-4o-mini',
                'max_output_tokens' => 220,
                'input' => $prompt,
            ]);

        Log::info('Compact notes response', [
            'status' => $response->status(),
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('OpenAI notes generation failed: ' . $response->body());
        }

        $text = $this->extractTextFromResponse($response->json());

        if (! $text) {
            throw new RuntimeException('OpenAI notes generation returned empty text.');
        }

        return trim($text);
    }

    protected function generateOutputs(string $apiKey, string $source, string $tone): array
    {
        $prompt = <<<PROMPT
Return only valid JSON.

Do not add markdown.
Do not wrap in triple backticks.
Do not add explanations.
Do not add any text before or after the JSON.

Create exactly these outputs:
- summary
- linkedin_post
- x_post

Tone: {$tone}

Output limits:
- summary: 60 to 100 words
- linkedin_post: 100 to 180 words
- x_post: under 280 characters

Rules:
- Stay faithful to the source
- Do not invent unsupported facts
- Keep the summary clear and useful
- Make LinkedIn professional and engaging
- Make X short and punchy

Return exactly this JSON structure:

{
  "summary": "string",
  "blog_post": "string",
  "linkedin_post": "string",
  "x_thread": "string"
}

Source material:
{$source}
PROMPT;

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->connectTimeout(15)
            ->post('https://api.openai.com/v1/responses', [
                'model' => 'gpt-4o-mini',
                'max_output_tokens' => 700,
                'input' => $prompt,
            ]);

        Log::info('VoicePost final generation response', [
            'status' => $response->status(),
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('OpenAI content generation failed: ' . $response->body());
        }

        $text = $this->extractTextFromResponse($response->json());

        if (! $text) {
            throw new RuntimeException('OpenAI content generation returned empty text.');
        }

        Log::info('VoicePost raw generation text', [
            'text' => $text,
        ]);

        $text = $this->sanitizeJsonText($text);

        $decoded = json_decode($text, true);

        if (! is_array($decoded)) {
            Log::error('VoicePost JSON decode failed', [
                'cleaned_text' => $text,
                'json_error' => json_last_error_msg(),
            ]);

            throw new RuntimeException('OpenAI did not return valid JSON. JSON error: ' . json_last_error_msg());
        }

        return [
            'summary' => trim((string) ($decoded['summary'] ?? '')),
            'linkedin_post' => trim((string) ($decoded['linkedin_post'] ?? '')),
            'x_post' => trim((string) ($decoded['x_post'] ?? '')),
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