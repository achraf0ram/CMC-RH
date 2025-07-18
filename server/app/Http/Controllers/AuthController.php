<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\AdminNotification;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        Auth::login($user);

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $request->email)->first();

        // إشعار أدمين عند تسجيل دخول مستخدم عادي
        if (!$user->is_admin) {
            AdminNotification::create([
                'title' => 'تسجيل دخول مستخدم',
                'title_fr' => 'Connexion utilisateur',
                'body' => $user->name . ' قام بتسجيل الدخول',
                'body_fr' => $user->name . ' s\'est connecté',
                'type' => 'userLogin',
                'is_read' => false,
                'data' => json_encode(['user_id' => $user->id]),
            ]);
            // إشعار لحظي للأدمين
            event(new \App\Events\NewNotification([
                'id' => $user->id,
                'title' => 'تسجيل دخول مستخدم',
                'title_fr' => 'Connexion utilisateur',
                'type' => 'userLogin',
                'user_id' => $user->id,
            ]));
        }

        return response()->json([
            'message' => 'Login successful',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request)
    {
        \Log::info('updateProfile called', [
            'auth_id' => Auth::id(),
            'user' => Auth::user(),
            'name' => $request->name,
            'phone' => $request->phone
        ]);
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
        ]);

        $user = Auth::user();
        $user->name = $request->name;
        $user->phone = $request->phone;
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    public function updateProfilePhoto(Request $request)
    {
        $request->validate([
            'profile_photo' => 'required|image|max:2048', // 2MB max
        ]);

        $user = Auth::user();
        
        // حذف الصورة القديمة إن وجدت
        if ($user->profile_photo_path && \Storage::disk('public')->exists($user->profile_photo_path)) {
            \Storage::disk('public')->delete($user->profile_photo_path);
        }

        // حفظ الصورة الجديدة
        $path = $request->file('profile_photo')->store('profile_photos', 'public');
        $user->profile_photo_path = $path;
        $user->save();

        return response()->json([
            'message' => 'Profile photo updated successfully',
            'user' => $user
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'كلمة المرور الحالية غير صحيحة'], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح']);
    }
}