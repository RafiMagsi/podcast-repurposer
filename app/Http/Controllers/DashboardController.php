<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $episodes = $request->user()
            ->episodes()
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($episode) => [
                'id' => $episode->id,
                'public_id' => $episode->public_id,
                'title' => $episode->title,
                'status' => $episode->status,
                'tone' => $episode->tone,
                'original_file_name' => $episode->original_file_name,
                'created_at' => optional($episode->created_at)->toDateTimeString(),
            ]);

        return Inertia::render('Dashboard', [
            'episodes' => $episodes,
        ]);
    }
}