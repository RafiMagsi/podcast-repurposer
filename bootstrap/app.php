<?php

use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'content.rate' => \App\Http\Middleware\ContentActionRateLimit::class,
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (PostTooLargeException $exception, Request $request) {
            $message = 'This upload is too large for this server. Choose a smaller file and try again.';

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                    'errors' => [
                        'source_file' => [$message],
                    ],
                ], 413);
            }

            return back()->withErrors([
                'source_file' => $message,
            ]);
        });

        $exceptions->render(function (\Throwable $exception, Request $request) {
            if (app()->environment(['local', 'testing'])) {
                return null;
            }

            $status = 500;

            if ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();
            } elseif ($exception instanceof ModelNotFoundException) {
                $status = 404;
            } elseif ($exception instanceof AuthorizationException) {
                $status = 403;
            } elseif ($exception instanceof TokenMismatchException) {
                $status = 419;
            }

            $errorMap = [
                403 => [
                    'title' => 'Access Restricted',
                    'message' => 'You do not have permission to view this page or perform this action.',
                ],
                404 => [
                    'title' => 'Page Not Found',
                    'message' => 'The page you requested could not be found. It may have moved or no longer exist.',
                ],
                419 => [
                    'title' => 'Session Expired',
                    'message' => 'Your session expired. Refresh the page and try again.',
                ],
                429 => [
                    'title' => 'Too Many Requests',
                    'message' => 'Too many requests were made in a short time. Please wait a moment and try again.',
                ],
                500 => [
                    'title' => 'Something Went Wrong',
                    'message' => 'The request could not be completed right now. Please return home or try again shortly.',
                ],
                503 => [
                    'title' => 'Temporarily Unavailable',
                    'message' => 'This service is temporarily unavailable. Please try again in a little while.',
                ],
            ];

            $error = $errorMap[$status] ?? $errorMap[500];

            return Inertia::render('Error', [
                'status' => $status,
                'title' => $error['title'],
                'message' => $error['message'],
            ])->toResponse($request)->setStatusCode($status);
        });
    })->create();
