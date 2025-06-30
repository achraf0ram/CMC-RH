<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use App\Mail\CustomResetPasswordMail;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class PasswordResetLinkController extends Controller
{
    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('Request headers:', $request->headers->all());

        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'errors' => [
                    'email' => ['Aucun compte trouvé avec cet e-mail.']
                ]
            ], 422);
        }

        $token = app('auth.password.broker')->createToken($user);

        Mail::to($user->email)->send(new CustomResetPasswordMail($token, $user->email));

        return response()->json(['status' => 'Lien de réinitialisation envoyé.']);
    }
}
