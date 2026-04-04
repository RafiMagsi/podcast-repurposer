<?php

it('prevents caching on the register page', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
    $response->assertHeader('Pragma', 'no-cache');

    $cacheControl = (string) $response->headers->get('Cache-Control');

    expect($cacheControl)->toContain('no-store');
    expect($cacheControl)->toContain('no-cache');
    expect($cacheControl)->toContain('must-revalidate');
    expect($cacheControl)->toContain('private');
});

it('prevents caching on the login page', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
    $response->assertHeader('Pragma', 'no-cache');

    $cacheControl = (string) $response->headers->get('Cache-Control');

    expect($cacheControl)->toContain('no-store');
    expect($cacheControl)->toContain('no-cache');
    expect($cacheControl)->toContain('must-revalidate');
    expect($cacheControl)->toContain('private');
});
