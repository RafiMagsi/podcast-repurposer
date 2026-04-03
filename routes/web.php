<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PipelineController;
use App\Http\Controllers\AdminRunController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ContentRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;
use App\Services\S3DiskFactory;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/pipeline', PipelineController::class)->name('pipeline.index');
    Route::get('/pipeline/status', [PipelineController::class, 'status'])->name('pipeline.status');
    Route::get('/admin/runs', AdminRunController::class)
        ->middleware('admin')
        ->name('admin.runs.index');

    Route::get('/content-requests', [ContentRequestController::class, 'index'])->name('content-requests.index');
    Route::get('/content-requests/create', [ContentRequestController::class, 'create'])->name('content-requests.create');
    Route::post('/content-requests/suggestions', [ContentRequestController::class, 'suggestions'])
        ->middleware('content.rate:suggestions')
        ->name('content-requests.suggestions');
    Route::post('/content-requests', [ContentRequestController::class, 'store'])
        ->middleware('content.rate:create')
        ->name('content-requests.store');
    Route::get('/content-requests/{contentRequest}', [ContentRequestController::class, 'show'])
        ->name('content-requests.show');
    Route::get('/content-requests/{contentRequest}/status', [ContentRequestController::class, 'status'])
        ->name('content-requests.status');
    Route::post('/content-requests/{contentRequest}/retry-transcription', [ContentRequestController::class, 'retryTranscription'])
        ->middleware('content.rate:action')
        ->name('content-requests.retry-transcription');
    Route::post('/content-requests/{contentRequest}/regenerate-content', [ContentRequestController::class, 'regenerateContent'])
        ->middleware('content.rate:action')
        ->name('content-requests.regenerate-content');
    Route::post('/content-requests/{contentRequest}/cancel-processing', [ContentRequestController::class, 'cancelProcessing'])
        ->name('content-requests.cancel-processing');
    Route::delete('/content-requests/{contentRequest}', [ContentRequestController::class, 'destroy'])
        ->name('content-requests.destroy');
    Route::get('/content-requests/{contentRequest}/preview', [ContentRequestController::class, 'preview'])
        ->name('content-requests.preview');
    Route::get('/content-requests/{contentRequest}/thumbnail', [ContentRequestController::class, 'thumbnail'])
        ->name('content-requests.thumbnail');
});

Route::get('/signed/content-requests/{contentRequest}/preview', [ContentRequestController::class, 'signedPreview'])
    ->middleware('signed')
    ->withoutMiddleware([
        EncryptCookies::class,
        AddQueuedCookiesToResponse::class,
        StartSession::class,
        ShareErrorsFromSession::class,
        VerifyCsrfToken::class,
    ])
    ->name('content-requests.preview.signed');

Route::get('/signed/content-requests/{contentRequest}/thumbnail', [ContentRequestController::class, 'signedThumbnail'])
    ->middleware('signed')
    ->withoutMiddleware([
        EncryptCookies::class,
        AddQueuedCookiesToResponse::class,
        StartSession::class,
        ShareErrorsFromSession::class,
        VerifyCsrfToken::class,
    ])
    ->name('content-requests.thumbnail.signed');


Route::get('/test-s3', function (S3DiskFactory $factory) {
    try {
        $disk = $factory->make();

        $path = 'test/hello.txt';

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, 'hello from VoicePost AI');
        rewind($stream);

        $result = $disk->writeStream($path, $stream);
        fclose($stream);

        return [
            'result' => $result,
            'path' => $path,
        ];
    } catch (\Throwable $e) {
        dd([
            'message' => $e->getMessage(),
            'class' => get_class($e),
        ]);
    }
})->middleware(['auth']);

require __DIR__.'/auth.php';
