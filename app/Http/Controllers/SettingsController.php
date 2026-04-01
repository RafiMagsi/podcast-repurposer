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
            ],
        ]);
    }

    public function update(Request $request, SettingService $settings): RedirectResponse
    {
        $validated = $request->validate([
            'openai_api_key' => ['nullable', 'string'],
            'claude_api_key' => ['nullable', 'string'],
        ]);

        $settings->set('openai_api_key', $validated['openai_api_key'] ?? null, 'string', true);
        $settings->set('claude_api_key', $validated['claude_api_key'] ?? null, 'string', true);

        return redirect()
            ->route('settings.index')
            ->with('success', 'Settings updated successfully.');
    }
}