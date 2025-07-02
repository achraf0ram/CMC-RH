<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    // جلب إشعارات المستخدم الحالي
    public function index()
    {
        $user = Auth::user();
        $notifications = UserNotification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($notifications);
    }

    // تحديث حالة القراءة
    public function markAsRead($id)
    {
        $user = Auth::user();
        $notification = UserNotification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();
        $notification->is_read = true;
        $notification->save();
        return response()->json(['success' => true]);
    }

    // تحديث كل الإشعارات كمقروءة
    public function markAllAsRead()
    {
        $user = Auth::user();
        UserNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }
} 