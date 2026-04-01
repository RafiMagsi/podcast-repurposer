<?php

namespace App\Http\Controllers;

use App\Services\SettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(SettingService $settings): Response
    {
        return Inertia::render('Settings/Index', [
            'settings' => [
                'openai_api_key' => $settings->get('openai_api_key', ''),
                'claude_api_key' => $settings->get('claude_api_key', ''),
                'aws_access_key_id' => $settings->get('aws_access_key_id', ''),
                'aws_secret_access_key' => $settings->get('aws_secret_access_key', ''),
                'aws_default_region' => $settings->get('aws_default_region', ''),
                'aws_bucket' => $settings->get('aws_bucket', ''),
                'aws_url' => $settings->get('aws_url', ''),
                'aws_endpoint' => $settings->get('aws_endpoint', ''),
                'aws_use_path_style_endpoint' => $settings->get('aws_use_path_style_endpoint', 'false'),
            ],
        ]);
    }

    public function update(Request $request, SettingService $settings): RedirectResponse
    {
        $validated = $request->validate([
            'openai_api_key' => ['nullable', 'string'],
            'claude_api_key' => ['nullable', 'string'],
            'aws_access_key_id' => ['nullable', 'string'],
            'aws_secret_access_key' => ['nullable', 'string'],
            'aws_default_region' => ['nullable', 'string'],
            'aws_bucket' => ['nullable', 'string'],
            'aws_url' => ['nullable', 'string'],
            'aws_endpoint' => ['nullable', 'string'],
            'aws_use_path_style_endpoint' => ['nullable', 'in:true,false,1,0'],
        ]);

        foreach ($validated as $key => $value) {
            $settings->set($key, $value, 'string', true);
        }

        return redirect()
            ->route('settings.index')
            ->with('success', 'Settings updated successfully.');
    }
}