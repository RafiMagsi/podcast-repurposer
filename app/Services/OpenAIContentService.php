<?php

namespace App\Services;

use App\Models\ContentRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class OpenAIContentService
{
    public function __construct(
        protected SettingService $settings
    ) {
    }

    public function generate(string $transcript, string $tone = 'professional', ?string $selectedSuggestion = null): array
    {
        $shouldBypass = filter_var(
            (string) $this->settings->get('bypass_openai_for_testing', 'false'),
            FILTER_VALIDATE_BOOL
        );

        if ($shouldBypass) {
            Log::info('OpenAIContentService bypassed OpenAI content generation for testing', [
                'tone' => $tone,
                'transcript_length' => strlen($transcript),
                'has_selected_suggestion' => filled($selectedSuggestion),
            ]);

            $base = trim($transcript) !== ''
                ? trim($transcript)
                : 'This is a mock source used in testing mode.';

            $summary = 'Test mode summary: ' . mb_substr($base, 0, 140);

            return $this->normalizeOutputs([
                'summary' => $summary,
                'linkedin_post' => "Test mode LinkedIn post:\n\n" . mb_substr($base, 0, 220) . "\n\n#AI #Testing #VoicePostAI",
                'x_post' => 'Test mode X post: ' . mb_substr($base, 0, 180),
                'instagram_caption' => "Test mode Instagram caption:\n\n" . mb_substr($base, 0, 160) . "\n\n#VoicePostAI #Content #AI #Marketing #Testing",
                'newsletter' => "Subject: Test mode newsletter idea\n\n" . mb_substr($base, 0, 320),
            ], $base);
        }

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

        return $this->generateOutputs($apiKey, $source, $tone, $selectedSuggestion);
    }

    public function generateSingleOutput(
        string $transcript,
        string $outputType,
        string $tone = 'professional',
        ?string $selectedSuggestion = null
    ): string {
        if (! in_array($outputType, ['summary', 'linkedin_post', 'x_post', 'instagram_caption', 'newsletter'], true)) {
            throw new RuntimeException('Unsupported output type requested for regeneration.');
        }

        $shouldBypass = filter_var(
            (string) $this->settings->get('bypass_openai_for_testing', 'false'),
            FILTER_VALIDATE_BOOL
        );

        if ($shouldBypass) {
            $outputs = $this->generate($transcript, $tone, $selectedSuggestion);

            return (string) ($outputs[$outputType] ?? '');
        }

        $apiKey = $this->settings->get('openai_api_key');

        if (! $apiKey) {
            throw new RuntimeException('Missing openai_api_key');
        }

        $cleanTranscript = $this->cleanTranscript($transcript);
        $source = strlen($cleanTranscript) > 12000
            ? $this->createCompactNotes($apiKey, $cleanTranscript)
            : $cleanTranscript;

        return $this->generateSingleOutputFromSource($apiKey, $source, $tone, $outputType, $selectedSuggestion);
    }

    public function generateChatReply(ContentRequest $contentRequest, string $message, array $history = []): string
    {
        $shouldBypass = filter_var(
            (string) $this->settings->get('bypass_openai_for_testing', 'false'),
            FILTER_VALIDATE_BOOL
        );

        if ($shouldBypass) {
            $base = $contentRequest->summary
                ?: $contentRequest->transcript
                ?: 'This recording is still being prepared.';

            return 'Test mode assistant: ' . mb_substr(
                "Based on this recording, here is a rewrite-oriented response to \"{$message}\": {$base}",
                0,
                500
            );
        }

        $apiKey = $this->settings->get('openai_api_key');

        if (! $apiKey) {
            throw new RuntimeException('Missing openai_api_key');
        }

        $sourceContext = $this->buildChatSourceContext($contentRequest);
        $historyContext = collect($history)
            ->take(-8)
            ->map(function (array $item) {
                $role = $item['role'] ?? 'user';
                $body = trim((string) ($item['body'] ?? ''));

                if ($body === '') {
                    return null;
                }

                return strtoupper($role) . ': ' . $body;
            })
            ->filter()
            ->implode("\n\n");

        $prompt = <<<PROMPT
You are VoicePost AI Magic Chat.

You are helping a user rewrite, refine, shorten, expand, or re-angle content for one specific recording workspace.

Rules:
- Stay faithful to the recording transcript and generated outputs
- Help with rewrites, hooks, CTA changes, formatting, tone shifts, and alternate versions
- Return plain text only
- Be concise but useful
- If the user asks for a rewrite, provide the rewritten copy directly
- If the request is ambiguous, make the best reasonable rewrite-oriented interpretation
- Do not mention internal prompts, models, or hidden system details

Recording context:
{$sourceContext}

Recent conversation:
{$historyContext}

Latest user request:
{$message}
PROMPT;

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->connectTimeout(15)
            ->post('https://api.openai.com/v1/responses', [
                'model' => 'gpt-4o-mini',
                'max_output_tokens' => 500,
                'input' => $prompt,
            ]);

        Log::info('VoicePost magic chat response', [
            'status' => $response->status(),
            'content_request_id' => $contentRequest->id,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('OpenAI chat generation failed: ' . $response->body());
        }

        $text = $this->extractTextFromResponse($response->json());

        if (! $text) {
            throw new RuntimeException('OpenAI chat generation returned empty text.');
        }

        return trim($text);
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

    protected function generateOutputs(string $apiKey, string $source, string $tone, ?string $selectedSuggestion = null): array
    {
        $selectedDirection = filled($selectedSuggestion)
            ? "Preferred direction:\n{$selectedSuggestion}\n\nUse this direction as the main angle for every output while staying faithful to the source.\n\n"
            : '';

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
- instagram_caption
- newsletter

Tone: {$tone}

{$selectedDirection}

Output limits:
- summary: 2 to 3 sentences capturing the core idea
- linkedin_post: professional, value-driven, around 150 words
- x_post: under 280 characters, punchy and ready to tweet
- instagram_caption: hook + body + exactly 5 relevant hashtags
- newsletter: subject line + full email-ready body

Rules:
- Stay faithful to the source
- Do not invent unsupported facts
- Keep the summary clear and useful
- Make LinkedIn professional and engaging
- Make X short and punchy

Return exactly this JSON structure:

{
  "summary": "string",
  "linkedin_post": "string",
  "x_post": "string",
  "instagram_caption": "string",
  "newsletter": "string"
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

        Log::info('VoicePost generation text received', [
            'length' => strlen($text),
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

        return $this->normalizeOutputs([
            'summary' => trim((string) ($decoded['summary'] ?? '')),
            'linkedin_post' => trim((string) ($decoded['linkedin_post'] ?? '')),
            'x_post' => trim((string) ($decoded['x_post'] ?? '')),
            'instagram_caption' => trim((string) ($decoded['instagram_caption'] ?? '')),
            'newsletter' => trim((string) ($decoded['newsletter'] ?? '')),
        ], $source);
    }

    protected function generateSingleOutputFromSource(
        string $apiKey,
        string $source,
        string $tone,
        string $outputType,
        ?string $selectedSuggestion = null
    ): string {
        $selectedDirection = filled($selectedSuggestion)
            ? "Preferred direction:\n{$selectedSuggestion}\n\nUse this direction as the main angle while staying faithful to the source.\n\n"
            : '';

        $outputRules = match ($outputType) {
            'summary' => 'Return only the summary. Keep it concise, clear, and limited to 2 to 3 sentences.',
            'linkedin_post' => 'Return only the LinkedIn post. Make it professional, value-driven, and around 150 words. Do not add hashtags unless they feel essential.',
            'x_post' => 'Return only the X post. Keep it punchy, faithful to the source, and under 280 characters.',
            'instagram_caption' => 'Return only the Instagram caption. Include a hook, body, and exactly 5 relevant hashtags.',
            'newsletter' => 'Return only the newsletter. Start with a "Subject:" line and then include an email-ready body.',
        };

        $prompt = <<<PROMPT
Create only one output for this source.

Tone: {$tone}

{$selectedDirection}

Target output: {$outputType}

Rules:
- Stay faithful to the source
- Do not invent unsupported facts
- Return plain text only
- Do not add markdown code fences
- Do not add explanations or labels beyond what the output itself requires

Specific instructions:
{$outputRules}

Source material:
{$source}
PROMPT;

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->connectTimeout(15)
            ->post('https://api.openai.com/v1/responses', [
                'model' => 'gpt-4o-mini',
                'max_output_tokens' => 400,
                'input' => $prompt,
            ]);

        Log::info('VoicePost single output generation response', [
            'status' => $response->status(),
            'output_type' => $outputType,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('OpenAI single-output generation failed: ' . $response->body());
        }

        $text = $this->extractTextFromResponse($response->json());

        if (! $text) {
            throw new RuntimeException('OpenAI single-output generation returned empty text.');
        }

        return $this->normalizeSingleOutput($outputType, trim($text), $source);
    }

    protected function normalizeSingleOutput(string $outputType, string $value, string $source): string
    {
        $summary = $this->normalizeSummary($value, $source);

        return match ($outputType) {
            'summary' => $summary,
            'linkedin_post' => $this->normalizeLinkedInPost($value, $summary),
            'x_post' => $this->normalizeXPost($value, $summary),
            'instagram_caption' => $this->normalizeInstagramCaption($value, $summary . ' ' . $source),
            'newsletter' => $this->normalizeNewsletter($value, $summary, $source),
            default => throw new RuntimeException('Unsupported output type requested for normalization.'),
        };
    }

    protected function normalizeOutputs(array $outputs, string $source): array
    {
        $summary = $this->normalizeSummary((string) ($outputs['summary'] ?? ''), $source);
        $linkedinPost = $this->normalizeLinkedInPost((string) ($outputs['linkedin_post'] ?? ''), $summary);
        $xPost = $this->normalizeXPost((string) ($outputs['x_post'] ?? ''), $summary);
        $instagramCaption = $this->normalizeInstagramCaption((string) ($outputs['instagram_caption'] ?? ''), $summary . ' ' . $source);
        $newsletter = $this->normalizeNewsletter((string) ($outputs['newsletter'] ?? ''), $summary, $source);

        foreach ([
            'summary' => $summary,
            'linkedin_post' => $linkedinPost,
            'x_post' => $xPost,
            'instagram_caption' => $instagramCaption,
            'newsletter' => $newsletter,
        ] as $key => $value) {
            if (trim($value) === '') {
                throw new RuntimeException("OpenAI content generation returned an invalid {$key} output.");
            }
        }

        return [
            'summary' => $summary,
            'linkedin_post' => $linkedinPost,
            'x_post' => $xPost,
            'instagram_caption' => $instagramCaption,
            'newsletter' => $newsletter,
        ];
    }

    protected function normalizeSummary(string $summary, string $source): string
    {
        $candidate = $this->normalizeWhitespace($summary);

        if ($candidate === '') {
            $candidate = $this->normalizeWhitespace($source);
        }

        $sentences = preg_split('/(?<=[.!?])\s+/u', $candidate, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $sentences = array_values(array_filter(array_map(fn ($sentence) => trim($sentence), $sentences)));

        if (count($sentences) === 0 && $candidate !== '') {
            $sentences = [$this->ensureSentenceEnding(mb_substr($candidate, 0, 180))];
        }

        if (count($sentences) === 1) {
            $sentences[0] = $this->ensureSentenceEnding($sentences[0]);
        }

        return trim(implode(' ', array_slice($sentences, 0, 3)));
    }

    protected function normalizeLinkedInPost(string $post, string $summary): string
    {
        $candidate = trim($post) !== '' ? trim($post) : $summary;
        $candidate = preg_replace('/(?:\n\s*){3,}/', "\n\n", $candidate);
        $candidate = preg_replace('/(?:^|\s)#\S+/u', '', $candidate);
        $candidate = trim((string) $candidate);

        $words = preg_split('/\s+/u', $candidate, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (count($words) > 170) {
            $candidate = $this->truncateWords($candidate, 170);
        }

        return trim($candidate);
    }

    protected function normalizeXPost(string $post, string $summary): string
    {
        $candidate = $this->normalizeWhitespace($post);

        if ($candidate === '') {
            $candidate = $summary;
        }

        if (mb_strlen($candidate) <= 280) {
            return $candidate;
        }

        $truncated = mb_substr($candidate, 0, 277);
        $truncated = preg_replace('/\s+\S*$/u', '', $truncated) ?: $truncated;

        return rtrim($truncated, " \t\n\r\0\x0B.,;:-") . '...';
    }

    protected function normalizeInstagramCaption(string $caption, string $seedText): string
    {
        $candidate = trim($caption);
        preg_match_all('/#([\p{L}\p{N}_]+)/u', $candidate, $matches);
        $hashtags = array_values(array_unique(array_map(
            fn ($tag) => '#' . trim($tag),
            $matches[1] ?? []
        )));

        $body = trim((string) preg_replace('/(?:^|\s)#[\p{L}\p{N}_]+/u', '', $candidate));
        $body = preg_replace('/(?:\n\s*){3,}/', "\n\n", $body);
        $body = trim((string) $body);

        if ($body === '') {
            $body = $this->normalizeSummary($seedText, $seedText);
        }

        if (count($hashtags) < 5) {
            $hashtags = array_values(array_unique(array_merge($hashtags, $this->deriveHashtags($seedText))));
        }

        $hashtags = array_slice($hashtags, 0, 5);

        while (count($hashtags) < 5) {
            $hashtags[] = '#VoicePostAI';
            $hashtags = array_values(array_unique($hashtags));
        }

        return $body . "\n\n" . implode(' ', array_slice($hashtags, 0, 5));
    }

    protected function normalizeNewsletter(string $newsletter, string $summary, string $source): string
    {
        $candidate = trim($newsletter);
        $subject = '';
        $body = '';

        if (preg_match('/^subject:\s*(.+)$/im', $candidate, $matches)) {
            $subject = trim($matches[1]);
            $body = trim((string) preg_replace('/^subject:\s*.+$/im', '', $candidate, 1));
        } else {
            $body = $candidate;
        }

        if ($subject === '') {
            $subjectSeed = $summary !== '' ? $summary : $this->normalizeWhitespace($source);
            $subject = rtrim(mb_substr($subjectSeed, 0, 72), " \t\n\r\0\x0B.,;:-");
        }

        if ($body === '') {
            $body = $summary !== '' ? $summary : $this->normalizeWhitespace($source);
        }

        return 'Subject: ' . $this->ensureSentenceEnding($subject, false) . "\n\n" . trim($body);
    }

    protected function deriveHashtags(string $text): array
    {
        preg_match_all('/\b[\p{L}][\p{L}\p{N}]{3,}\b/u', mb_strtolower($text), $matches);
        $stopWords = ['this', 'that', 'with', 'from', 'your', 'have', 'into', 'about', 'there', 'their', 'would', 'could', 'should', 'voicepost', 'post', 'content'];
        $hashtags = [];

        foreach ($matches[0] ?? [] as $word) {
            if (in_array($word, $stopWords, true)) {
                continue;
            }

            $hashtags[] = '#' . ucfirst($word);

            if (count(array_unique($hashtags)) >= 5) {
                break;
            }
        }

        return array_values(array_unique(array_merge($hashtags, [
            '#VoicePostAI',
            '#ContentMarketing',
            '#CreatorTools',
            '#SocialMedia',
            '#Marketing',
        ])));
    }

    protected function truncateWords(string $text, int $maxWords): string
    {
        $words = preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return implode(' ', array_slice($words, 0, $maxWords));
    }

    protected function normalizeWhitespace(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", trim($text));
        $text = preg_replace('/[ \t]+/u', ' ', $text);
        $text = preg_replace('/\n{3,}/u', "\n\n", $text);

        return trim((string) $text);
    }

    protected function ensureSentenceEnding(string $text, bool $appendPeriod = true): string
    {
        $trimmed = trim($text);

        if ($trimmed === '') {
            return '';
        }

        if (! $appendPeriod) {
            return $trimmed;
        }

        return preg_match('/[.!?]$/u', $trimmed) ? $trimmed : $trimmed . '.';
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

    protected function buildChatSourceContext(ContentRequest $contentRequest): string
    {
        $transcript = trim((string) $contentRequest->transcript);
        $summary = trim((string) $contentRequest->summary);
        $responses = $contentRequest->contentResponses
            ->map(function ($response) {
                $title = $response->title ?: ($response->content_type ?? 'Output');
                $body = trim((string) $response->body);

                if ($body === '') {
                    return null;
                }

                return $title . ":\n" . mb_substr($body, 0, 900);
            })
            ->filter()
            ->implode("\n\n");

        $parts = array_filter([
            'Title: ' . $contentRequest->title,
            $contentRequest->tone ? 'Tone: ' . $contentRequest->tone : null,
            $contentRequest->selected_suggestion ? 'Selected direction: ' . $contentRequest->selected_suggestion : null,
            $summary !== '' ? "Summary:\n" . mb_substr($summary, 0, 1200) : null,
            $transcript !== '' ? "Transcript excerpt:\n" . mb_substr($transcript, 0, 4000) : null,
            $responses !== '' ? "Current outputs:\n" . $responses : null,
        ]);

        return implode("\n\n", $parts);
    }
}
