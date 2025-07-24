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
use App\Events\NewNotification;
use App\Http\Controllers\ChatMessageController;
use Illuminate\Support\Facades\Broadcast;




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
Route::middleware('auth:sanctum')->post('/user/profile-photo', [AuthController::class, 'updateProfilePhoto']);
Route::middleware('auth:sanctum')->post('/user/change-password', [\App\Http\Controllers\AuthController::class, 'changePassword']);

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
    \Log::info('Admin group route called: ' . request()->method() . ' ' . request()->path());
    Route::get('/summary', [AdminDashboardController::class, 'summary']);
    Route::get('/requests', [AdminDashboardController::class, 'requests']);
    Route::get('/users', [AdminDashboardController::class, 'users']);
    Route::post('/requests/{type}/{id}/status', [AdminDashboardController::class, 'updateStatus']);
    Route::get('/urgent-messages', [UrgentMessageController::class, 'index']);
    Route::get('/chat-urgent-messages', [ChatMessageController::class, 'urgentMessages']); // جديد
    Route::post('/chat-urgent-messages/{id}/mark-read', [ChatMessageController::class, 'markAsRead']); // جديد
    Route::post('/chat-urgent-messages/mark-all-read', [ChatMessageController::class, 'markAllUrgentAsRead']); // جديد
    Route::delete('/urgent-messages/{id}', [UrgentMessageController::class, 'destroy']);
    Route::post('/urgent-messages/{id}/reply', [UrgentMessageController::class, 'reply']);
    Route::delete('/requests/{type}/{id}', [AdminDashboardController::class, 'destroy']);
    Route::post('/urgent-messages/mark-all-read', [UrgentMessageController::class, 'markAllRead']);
    // route رفع ملف الطلب
    Route::post('/requests/upload-file/{type}/{id}', [AdminDashboardController::class, 'uploadRequestFile']);
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

Route::middleware('auth:sanctum')->get('/download-pdf/{id}', [\App\Http\Controllers\MissionOrderController::class, 'downloadPDF']);
Route::middleware('auth:sanctum')->get('/download-pdf-db/{id}', [\App\Http\Controllers\MissionOrderController::class, 'downloadPDFfromDB']);
Route::middleware('auth:sanctum')->get('/download-pdf-vacation/{id}', [\App\Http\Controllers\VacationRequestController::class, 'downloadPDF']);

Route::post('/vacation-requests/{id}/status', [\App\Http\Controllers\VacationRequestController::class, 'updateStatus']);

Route::get('/test-notification', function () {
    $notification = [
        'title' => 'تنبيه جديد',
        'body' => 'هذا إشعار لحظي تجريبي',
        'time' => now()->toDateTimeString(),
    ];
    event(new NewNotification($notification));
    return response()->json(['sent' => true]);
});

Route::middleware('auth:sanctum')->group(function () {
    // جلب كل الرسائل بين المستخدم الحالي وطرف آخر
    Route::get('/chat/{user_id}', [ChatMessageController::class, 'getMessages']);
    // إرسال رسالة جديدة
    Route::post('/chat/send', [ChatMessageController::class, 'sendMessage']);
});

Route::get('/admin/notifications/unread-count', [AdminDashboardController::class, 'unreadAdminNotificationsCount']);
Route::get('/admin/notifications/all', [AdminDashboardController::class, 'allAdminNotifications']);
Route::get('/admin/notifications/latest', [AdminDashboardController::class, 'latestAdminNotification']);
Route::post('/admin/notifications/mark-all-read', [AdminDashboardController::class, 'markAllAdminNotificationsRead']);

// Broadcasting authentication route for API
Route::middleware('auth:sanctum')->post('/broadcasting/auth', function (Request $request) {
    \Log::info('Broadcasting auth attempt', [
        'user' => $request->user(),
        'headers' => $request->headers->all(),
        'socket_id' => $request->input('socket_id'),
        'channel_name' => $request->input('channel_name')
    ]);
    
    return Broadcast::auth($request);
});

// Test route to check authentication
Route::middleware('auth:sanctum')->get('/test-auth', function (Request $request) {
    return response()->json([
        'authenticated' => true,
        'user' => $request->user(),
        'token' => $request->bearerToken()
    ]);
});

// Salary Domiciliation user history
Route::get('/salary-domiciliations/user-domiciliations', [\App\Http\Controllers\SalaryDomiciliationController::class, 'userDomiciliations']);
// Annual Income user history
Route::get('/annual-incomes/user-annual-incomes', [\App\Http\Controllers\AnnualIncomeController::class, 'userAnnualIncomes']);

// Download Work Certificate PDF by ID
Route::get('/work-certificates/download/{id}', [\App\Http\Controllers\WorkCertificateController::class, 'downloadPDF']);
Route::get('/work-certificates/download-db/{id}', [\App\Http\Controllers\WorkCertificateController::class, 'downloadPDFfromDB']);

// تحميل ملف vacation من التخزين بشكل آمن
Route::get('/secure-vacation-download/{filename}', [\App\Http\Controllers\VacationRequestController::class, 'secureDownload'])->middleware('auth:api');

Route::get('/mission-orders/download/{id}', [\App\Http\Controllers\MissionOrderController::class, 'downloadPDF']);
Route::get('/mission-orders/download-db/{id}', [\App\Http\Controllers\MissionOrderController::class, 'downloadPDFfromDB']);

