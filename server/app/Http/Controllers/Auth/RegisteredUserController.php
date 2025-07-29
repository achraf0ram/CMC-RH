<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use App\Models\AdminNotification;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        \Log::info('Register request', $request->all());
        try {
            $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
                'phone' => ['required', 'string', 'max:20'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            $isAdmin = $request->email === 'cmc.rh.ram@gmail.com';

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'is_admin' => $isAdmin,
            ]);

            // إشعار أدمين
            AdminNotification::create([
                'title' => 'تسجيل مستخدم جديد',
                'title_fr' => 'Nouvel utilisateur',
                'body' => $request->name . ' قام بإنشاء حساب جديد',
                'body_fr' => $request->name . ' a créé un nouveau compte',
                'type' => 'newUser',
                'is_read' => false,
                'data' => json_encode(['user_id' => $user->id]),
            ]);
            // إشعار لحظي للأدمين
            try {
            event(new \App\Events\NewNotification([
                'id' => $user->id,
                'title' => 'تسجيل مستخدم جديد',
                'title_fr' => 'Nouvel utilisateur',
                'type' => 'newUser',
                'user_id' => $user->id,
            ]));
            } catch (\Exception $e) {
                \Log::error('Broadcast error: ' . $e->getMessage());
            }

            event(new Registered($user));

            Auth::login($user);

            return response()->json([
                'message' => 'تم التسجيل بنجاح',
                'user' => $user
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Register error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'حدث خطأ أثناء التسجيل',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 