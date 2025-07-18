<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatMessageController extends Controller
{
    // جلب كل الرسائل بين المستخدم الحالي وطرف آخر (مثلاً الأدمين)
    public function getMessages($userId)
    {
        $currentUserId = Auth::id();
        $messages = ChatMessage::where(function($q) use ($currentUserId, $userId) {
                $q->where('from_user_id', $currentUserId)
                  ->where('to_user_id', $userId);
            })
            ->orWhere(function($q) use ($currentUserId, $userId) {
                $q->where('from_user_id', $userId)
                  ->where('to_user_id', $currentUserId);
            })
            ->orderBy('created_at', 'asc')
            ->get();
        return response()->json($messages);
    }

    // إرسال رسالة جديدة
    public function sendMessage(Request $request)
    {
        $request->validate([
            'to_user_id' => 'required|exists:users,id',
            'message' => 'nullable|string',
            'image' => 'nullable|image|max:4096', // صورة اختيارية
            'file' => 'nullable|file|mimes:pdf,doc,docx,txt|max:10240', // ملف PDF أو مستند اختياري (10MB max)
        ]);

        \Log::info('ملف الصورة:', [
            'hasFile' => $request->hasFile('image'),
            'hasDocument' => $request->hasFile('file'),
            'all' => $request->all(),
            'files' => $request->file(),
        ]);

        $imagePath = null;
        $filePath = null;
        $fileType = null;

        if ($request->hasFile('image')) {
            $storedPath = $request->file('image')->store('chat_images', 'public');
            // حفظ فقط اسم الملف وليس المسار الكامل
            $imagePath = basename($storedPath);
        }

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileType = $file->getClientOriginalExtension();
            $storedPath = $file->store('chat_files', 'public');
            // حفظ فقط اسم الملف وليس المسار الكامل
            $filePath = basename($storedPath);
        }

        $message = ChatMessage::create([
            'from_user_id' => Auth::id(),
            'to_user_id' => $request->to_user_id,
            'message' => $request->message,
            'image_path' => $imagePath ? 'chat_images/' . $imagePath : null,
            'file_path' => $filePath ? 'chat_files/' . $filePath : null,
            'file_type' => $fileType,
            'is_urgent' => $request->boolean('is_urgent', false),
        ]);

        return response()->json($message, 201);
    }

    public function urgentMessages(Request $request)
    {
        $adminId = Auth::id();
        
        $messages = ChatMessage::where('to_user_id', $adminId)
            ->where('is_urgent', true)
            ->where('is_read', false)
            ->with(['sender:id,name,email', 'receiver:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get(['id', 'from_user_id', 'to_user_id', 'message', 'image_path', 'file_path', 'file_type', 'is_urgent', 'is_read', 'created_at', 'updated_at']);
        
        return response()->json($messages);
    }

    // تحديث حالة الرسالة كمقروءة
    public function markAsRead($messageId)
    {
        $adminId = Auth::id();
        $message = ChatMessage::where('id', $messageId)
            ->where('to_user_id', $adminId)
            ->first();
        
        if ($message) {
            $message->update(['is_read' => true]);
            return response()->json(['success' => true]);
        }
        
        return response()->json(['success' => false], 404);
    }

    // تحديث جميع الرسائل العاجلة كمقروءة
    public function markAllUrgentAsRead()
    {
        $adminId = Auth::id();
        ChatMessage::where('to_user_id', $adminId)
            ->where('is_urgent', true)
            ->where('is_read', false)
            ->update(['is_read' => true]);
        
        return response()->json(['success' => true]);
    }
}
