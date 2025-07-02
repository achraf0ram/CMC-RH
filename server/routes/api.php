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
use App\Http\Controllers\SalaryDomiciliationController;
use App\Http\Controllers\AnnualIncomeController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Controllers\UrgentMessageController;
use App\Http\Controllers\NotificationController;




Route::post('/work-certificates', [WorkCertificateController::class, 'store']);
Route::post('/vacation-requests', [VacationRequestController::class, 'store']);
Route::post('/mission-orders', [MissionOrderController::class, 'store']);
Route::post('/salary-domiciliations', [SalaryDomiciliationController::class, 'store']);
Route::post('/annual-incomes', [AnnualIncomeController::class, 'store']);
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

// للمستخدم العادي (إرسال رسالة عاجلة)
Route::middleware('auth:sanctum')->post('/urgent-messages', [UrgentMessageController::class, 'store']);
Route::middleware('auth:sanctum')->get('/urgent-messages/me', [UrgentMessageController::class, 'userMessages']);

Route::middleware(['auth:sanctum', AdminMiddleware::class])->prefix('admin')->group(function () {
    Route::get('/summary', [AdminDashboardController::class, 'summary']);
    Route::get('/requests', [AdminDashboardController::class, 'requests']);
    Route::get('/users', [AdminDashboardController::class, 'users']);
    Route::post('/requests/{type}/{id}/status', [AdminDashboardController::class, 'updateStatus']);
    Route::get('/urgent-messages', [UrgentMessageController::class, 'index']);
    Route::delete('/urgent-messages/{id}', [UrgentMessageController::class, 'destroy']);
    Route::post('/urgent-messages/{id}/reply', [UrgentMessageController::class, 'reply']);
});

// إشعارات المستخدم
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});

Route::middleware('auth:sanctum')->get('/vacation-requests/user/count', [\App\Http\Controllers\VacationRequestController::class, 'userCount']);
Route::middleware('auth:sanctum')->get('/mission-orders/user/count', [\App\Http\Controllers\MissionOrderController::class, 'userCount']);
Route::middleware('auth:sanctum')->get('/work-certificates/user/count', [\App\Http\Controllers\WorkCertificateController::class, 'userCount']);

Route::middleware('auth:sanctum')->get('/vacation-requests/user', [\App\Http\Controllers\VacationRequestController::class, 'userRequests']);
Route::middleware('auth:sanctum')->get('/mission-orders/user', [\App\Http\Controllers\MissionOrderController::class, 'userOrders']);
Route::middleware('auth:sanctum')->get('/work-certificates/user', [\App\Http\Controllers\WorkCertificateController::class, 'userCertificates']);

