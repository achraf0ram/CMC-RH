<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\WorkCertificateController;
use App\Http\Controllers\VacationRequestController;
use App\Http\Controllers\MissionOrderController;
use App\Models\User;
use App\Http\Controllers\Auth\PasswordResetLinkController;




Route::post('/work-certificates', [WorkCertificateController::class, 'store']);
Route::post('/vacation-requests', [VacationRequestController::class, 'store']);
Route::post('/mission-orders', [MissionOrderController::class, 'store']);
Route::get('/vacation-requests/pending/count', [VacationRequestController::class, 'countPending']);
Route::get('/vacation-requests/approved/count', [VacationRequestController::class, 'countApproved']);
Route::get('/vacation-requests/vacation-days/sum', [VacationRequestController::class, 'countVacationDays']);
Route::get('/mission-orders/count', [MissionOrderController::class, 'countAll']);
Route::get('/work-certificates/count', [WorkCertificateController::class, 'countAll']);
Route::get('/vacation-requests/count', [VacationRequestController::class, 'countAll']);

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->put('/user/profile', [AuthController::class, 'updateProfile']);

// Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
//     return response()->json($request->user());
// });

// Public routes
// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/login', [AuthController::class, 'login']);

// // Protected routes
// Route::middleware('auth:sanctum')->group(function () {
//     Route::post('/logout', [AuthController::class, 'logout']);
//     Route::get('/user', [AuthController::class, 'user']);
// });

Route::post('/check-email-exists', function (Request $request) {
    $request->validate([
        'email' => ['required', 'email'],
    ]);
    $exists = User::where('email', $request->email)->exists();
    return response()->json(['exists' => $exists]);
});

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);

