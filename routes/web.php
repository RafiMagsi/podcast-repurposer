<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ContentRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;
use App\Services\S3DiskFactory;


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

    Route::get('/content-requests', [ContentRequestController::class, 'index'])->name('content-requests.index');
    Route::get('/content-requests/create', [ContentRequestController::class, 'create'])->name('content-requests.create');
    Route::post('/content-requests', [ContentRequestController::class, 'store'])->name('content-requests.store');
    Route::get('/content-requests/{contentRequest}', [ContentRequestController::class, 'show'])
        ->name('content-requests.show');
    Route::post('/content-requests/{contentRequest}/retry-transcription', [ContentRequestController::class, 'retryTranscription'])
        ->name('content-requests.retry-transcription');
    Route::post('/content-requests/{contentRequest}/regenerate-content', [ContentRequestController::class, 'regenerateContent'])
        ->name('content-requests.regenerate-content');
    Route::delete('/content-requests/{contentRequest}', [ContentRequestController::class, 'destroy'])
        ->name('content-requests.destroy');
    Route::get('/content-requests/{contentRequest}/preview', [ContentRequestController::class, 'preview'])
        ->name('content-requests.preview');
});


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
