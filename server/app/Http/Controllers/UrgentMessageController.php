<?php

namespace App\Http\Controllers;

use App\Models\UrgentMessage;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UrgentMessageController extends Controller
{
    // جلب جميع الرسائل العاجلة (للأدمن)
    public function index()
    {
        $messages = UrgentMessage::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($messages);
    }

    // إرسال رسالة عاجلة (للمستخدم)
    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
        ]);
        $urgentMessage = UrgentMessage::create([
            'user_id' => Auth::id(),
            'message' => $request->message,
            'is_read' => false,
        ]);
        return response()->json($urgentMessage, 201);
    }

    // حذف رسالة عاجلة (للأدمن)
    public function destroy($id)
    {
        $message = UrgentMessage::findOrFail($id);
        $message->delete();
        return response()->json(['success' => true]);
    }

    // رد الأدمن على رسالة عاجلة
    public function reply(Request $request, $id)
    {
        $request->validate([
            'admin_reply' => 'required|string',
        ]);
        $message = UrgentMessage::findOrFail($id);
        $message->admin_reply = $request->admin_reply;
        $message->is_replied = true;
        $message->save();

        // إشعار المستخدم بالرد
        UserNotification::create([
            'user_id' => $message->user_id,
            'type' => 'replied',
            'title_ar' => 'تم الرد على رسالتك العاجلة',
            'title_fr' => 'Réponse à votre message urgent',
            'body_ar' => $request->admin_reply,
            'body_fr' => $request->admin_reply,
        ]);

        return response()->json(['success' => true, 'message' => $message]);
    }

    // جلب الرسائل العاجلة الخاصة بالمستخدم الحالي
    public function userMessages()
    {
        $userId = Auth::id();
        $messages = UrgentMessage::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($messages);
    }
} 