<?php

use App\Services\OpenAIContentService;
use App\Services\SettingService;
use Illuminate\Support\Facades\Http;

it('normalizes all five content outputs to the product contract', function () {
    $settings = Mockery::mock(SettingService::class);
    $settings->shouldReceive('get')->with('bypass_openai_for_testing', 'false')->andReturn('false');
    $settings->shouldReceive('get')->with('openai_api_key')->andReturn('test-key');

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output_text' => json_encode([
                'summary' => 'First summary sentence. Second summary sentence. Third summary sentence. Fourth summary sentence.',
                'linkedin_post' => "A practical lesson for founders.\n\nUse the signal, not the noise. #Founder #Startup",
                'x_post' => str_repeat('This is a deliberately long X post that should be trimmed safely. ', 8),
                'instagram_caption' => "Hook line here.\nBody line here.\n\n#growth #founders",
                'newsletter' => "A short newsletter opening without a subject line.\n\nHere is the main body for the email.",
            ], JSON_UNESCAPED_SLASHES),
        ], 200),
    ]);

    $service = new OpenAIContentService($settings);

    $outputs = $service->generate('A founder explains how one sales call changed pricing decisions.', 'professional');

    expect(substr_count($outputs['summary'], '.'))->toBeLessThanOrEqual(3);
    expect($outputs['linkedin_post'])->not->toContain('#Founder');
    expect(mb_strlen($outputs['x_post']))->toBeLessThanOrEqual(280);
    expect(preg_match_all('/#([\p{L}\p{N}_]+)/u', $outputs['instagram_caption'], $matches))->toBe(5);
    expect($outputs['newsletter'])->toStartWith('Subject: ');
    expect(trim(str_replace(preg_replace('/^subject:\s*.+$/im', '', $outputs['newsletter'], 1), '', $outputs['newsletter'])))->not->toBe('');
});

it('keeps bypass-mode outputs inside the same product contract', function () {
    $settings = Mockery::mock(SettingService::class);
    $settings->shouldReceive('get')->with('bypass_openai_for_testing', 'false')->andReturn('true');

    $service = new OpenAIContentService($settings);

    $outputs = $service->generate('A short transcript for testing mode.', 'professional');

    expect($outputs['summary'])->not->toBe('');
    expect(mb_strlen($outputs['x_post']))->toBeLessThanOrEqual(280);
    expect(preg_match_all('/#([\p{L}\p{N}_]+)/u', $outputs['instagram_caption'], $matches))->toBe(5);
    expect($outputs['newsletter'])->toStartWith('Subject: ');
});
