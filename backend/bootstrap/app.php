<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Pure token-based API — no CSRF, no sessions
        $middleware->api(remove: [
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        });
    })->create();
