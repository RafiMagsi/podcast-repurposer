<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class ClaudeService
{
    public function __construct(
        protected SettingService $settings
    ) {
    }

    public function generate(string $transcript, string $tone = 'professional'): array
    {
        Log::info('ClaudeService generate started', [
            'tone' => $tone,
            'transcript_length' => strlen($transcript),
        ]);

        $apiKey = $this->settings->get('claude_api_key');

        if (! $apiKey) {
            throw new RuntimeException('Missing claude_api_key');
        }

        $prompt = <<<PROMPT
You are an expert AI content repurposing assistant.

Create exactly these outputs from the transcript below:
1. summary
2. blog_post
3. linkedin_post
4. x_thread

Tone: {$tone}

Rules:
- Stay faithful to the transcript
- Do not invent unsupported facts
- Make the summary concise
- Make the blog post structured and readable
- Make the LinkedIn post professional and engaging
- Make the X thread concise, punchy, and split into numbered thread-style posts
- Return valid JSON only
- Use this exact JSON shape:

{
  "summary": "string",
  "blog_post": "string",
  "linkedin_post": "string",
  "x_thread": "string"
}

Transcript:
{$transcript}
PROMPT;

        Log::info('Sending transcript to Claude API');

        $response = Http::withHeaders([
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])
            ->timeout(120)
            ->connectTimeout(15)
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => 'claude-sonnet-4-5',
                'max_tokens' => 4000,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
            ]);

        Log::info('Claude response received', [
            'status' => $response->status(),
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Claude generation failed: ' . $response->body());
        }

        $content = data_get($response->json(), 'content.0.text');

        if (! $content) {
            throw new RuntimeException('Claude returned empty content.');
        }

        $decoded = json_decode($content, true);

        if (! is_array($decoded)) {
            throw new RuntimeException('Claude did not return valid JSON.');
        }

        Log::info('Claude JSON parsed successfully');

        return [
            'summary' => trim((string) ($decoded['summary'] ?? '')),
            'blog_post' => trim((string) ($decoded['blog_post'] ?? '')),
            'linkedin_post' => trim((string) ($decoded['linkedin_post'] ?? '')),
            'x_thread' => trim((string) ($decoded['x_thread'] ?? '')),
        ];
    }
}