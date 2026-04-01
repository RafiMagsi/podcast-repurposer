<?php

use App\Models\User;

it('redirects guests from episodes pages', function () {
    $this->get(route('episodes.index'))->assertRedirect(route('login'));
    $this->get(route('episodes.create'))->assertRedirect(route('login'));
});

it('allows authenticated users to view episode pages', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('episodes.index'))->assertOk();
    $this->actingAs($user)->get(route('episodes.create'))->assertOk();
    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});