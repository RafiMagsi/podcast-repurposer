<?php

use App\Models\ContentRequest;
use App\Models\User;

it('blocks non-admin users from the admin run monitor', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)
        ->get(route('admin.runs.index'))
        ->assertForbidden();
});

it('shows the admin run monitor with filters', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $otherUser = User::factory()->create();

    ContentRequest::create([
        'user_id' => $otherUser->id,
        'title' => 'Failed run',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_FAILED,
    ]);

    ContentRequest::create([
        'user_id' => $otherUser->id,
        'title' => 'Processing run',
        'tone' => 'professional',
        'input_type' => 'video',
        'media_kind' => 'video',
        'original_file_name' => 'clip.mp4',
        'file_path' => 'content-requests/test.mp4',
        'mime_type' => 'video/mp4',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_TRANSCRIBING,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.runs.index', ['filter' => 'failed']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Runs/Index')
            ->where('filters.current', 'failed'))
        ->assertSee('Failed run')
        ->assertSee($otherUser->email);

    $this->actingAs($admin)
        ->get(route('admin.runs.index', ['filter' => 'processing']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Runs/Index')
            ->where('filters.current', 'processing'))
        ->assertSee('Processing run');
});
