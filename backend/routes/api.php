<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\DailyStateController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\InputController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\ImportController;

// Auth (public)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Protected
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Import from Google Sheets
    Route::post('/import', [ImportController::class, 'import']);

    // Tasks
    Route::get('/tasks',                    [TaskController::class, 'index']);
    Route::get('/tasks/today',              [TaskController::class, 'today']);
    Route::post('/tasks',                   [TaskController::class, 'store']);
    Route::put('/tasks/{task}',             [TaskController::class, 'update']);
    Route::patch('/tasks/{task}/status',    [TaskController::class, 'updateStatus']);
    Route::patch('/tasks/{task}/link',      [TaskController::class, 'linkToProject']);
    Route::post('/tasks/{task}/reset',      [TaskController::class, 'resetRecurring']);
    Route::post('/tasks/{task}/timer/start', [TaskController::class, 'startTimer']);
    Route::post('/tasks/{task}/timer/pause', [TaskController::class, 'pauseTimer']);
    Route::post('/tasks/{task}/timer/stop',  [TaskController::class, 'stopTimer']);
    Route::delete('/tasks/{task}',          [TaskController::class, 'destroy']);
    Route::post('/tasks/cleanup',           [TaskController::class, 'cleanup']);
    Route::post('/tasks/assign-due-dates',  [TaskController::class, 'assignDueDates']);

    // Projects
    Route::get('/projects',                     [ProjectController::class, 'index']);
    Route::get('/projects/deleted',             [ProjectController::class, 'deleted']);
    Route::get('/projects/{project}',           [ProjectController::class, 'show']);
    Route::post('/projects',                    [ProjectController::class, 'store']);
    Route::put('/projects/{project}',           [ProjectController::class, 'update']);
    Route::delete('/projects/{project}',        [ProjectController::class, 'destroy']);
    Route::patch('/projects/{project}/restore', [ProjectController::class, 'restore']);

    // Daily State
    Route::get('/daily-state',  [DailyStateController::class, 'show']);
    Route::post('/daily-state', [DailyStateController::class, 'save']);

    // Profile
    Route::get('/profile',  [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'save']);

    // AI / Input
    Route::post('/ai/analyze',     [InputController::class, 'analyze']);
    Route::post('/input',          [InputController::class, 'create']);
    Route::get('/dashboard',       [InputController::class, 'dashboard']);
    Route::post('/pipeline/run',   [InputController::class, 'runPipeline']);
    Route::post('/pipeline/today', [InputController::class, 'generateToday']);

    // Audit
    Route::get('/audit-logs',  [AuditController::class, 'index']);
    Route::post('/audit-logs', [AuditController::class, 'store']);
});
