<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EpisodeController;
use App\Http\Controllers\SettingsController;
use App\Services\S3DiskFactory;
use Illuminate\Support\Facades\Log;


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

    Route::get('/episodes', [EpisodeController::class, 'index'])->name('episodes.index');
    Route::get('/episodes/create', [EpisodeController::class, 'create'])->name('episodes.create');
    Route::post('/episodes', [EpisodeController::class, 'store'])->name('episodes.store');
    Route::get('/episodes/{episode}', [EpisodeController::class, 'show'])
        ->name('episodes.show');
    Route::post('/episodes/{episode}/retry-transcription', [EpisodeController::class, 'retryTranscription'])
        ->name('episodes.retry-transcription');
    Route::post('/episodes/{episode}/regenerate-content', [EpisodeController::class, 'regenerateContent'])
        ->name('episodes.regenerate-content');
    Route::delete('/episodes/{episode}', [EpisodeController::class, 'destroy'])
        ->name('episodes.destroy');
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
