<?php

use App\Models\User;

it('redirects guests from content request pages', function () {
    $this->get(route('content-requests.index'))->assertRedirect(route('login'));
    $this->get(route('content-requests.create'))->assertRedirect(route('login'));
});

it('allows authenticated users to view content request pages', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('content-requests.index'))->assertOk();
    $this->actingAs($user)->get(route('content-requests.create'))->assertOk();
    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});
