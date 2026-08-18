<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user  = User::create([...$data, 'role' => 'user']);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data'    => ['user' => $this->formatUser($user), 'token' => $token],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials.']]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data'    => ['user' => $this->formatUser($user), 'token' => $token],
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->formatUser($request->user()),
        ]);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'avatar_url' => 'required|string|max:3000000',
        ]);

        if (! preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+\/=\r\n]+)$/', $data['avatar_url'], $matches)) {
            throw ValidationException::withMessages([
                'avatarUrl' => ['Please upload a PNG, JPG, or WebP image.'],
            ]);
        }

        $imageBytes = base64_decode($matches[2], true);
        if ($imageBytes === false) {
            throw ValidationException::withMessages([
                'avatarUrl' => ['The selected image could not be processed.'],
            ]);
        }

        if (@getimagesizefromstring($imageBytes) === false) {
            throw ValidationException::withMessages([
                'avatarUrl' => ['The selected file is not a valid image.'],
            ]);
        }

        if (strlen($imageBytes) > 1500000) {
            throw ValidationException::withMessages([
                'avatarUrl' => ['Profile photo is too large after processing.'],
            ]);
        }

        $extension = strtolower($matches[1]) === 'jpeg' ? 'jpg' : strtolower($matches[1]);
        $directory = public_path('uploads/profile-avatars');

        if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
            throw ValidationException::withMessages([
                'avatarUrl' => ['Profile photo storage is not available.'],
            ]);
        }

        $user = $request->user();
        $previousPath = parse_url($user->avatar_url ?? '', PHP_URL_PATH);
        $filename = 'user-' . $user->id . '-' . Str::uuid() . '.' . $extension;
        $path = $directory . DIRECTORY_SEPARATOR . $filename;

        if (file_put_contents($path, $imageBytes) === false) {
            throw ValidationException::withMessages([
                'avatarUrl' => ['Profile photo could not be saved.'],
            ]);
        }

        if ($previousPath && str_starts_with($previousPath, '/uploads/profile-avatars/')) {
            $previousLocalPath = public_path(ltrim($previousPath, '/'));
            if (is_file($previousLocalPath)) {
                @unlink($previousLocalPath);
            }
        }

        $user->avatar_url = url('uploads/profile-avatars/' . $filename);
        $user->save();

        return response()->json([
            'success' => true,
            'data'    => $this->formatUser($user),
            'message' => 'Profile photo updated',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email']);

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json([
                'success' => true,
                'message' => 'If the email exists, a reset link has been sent.',
            ]);
        }

        $token = Str::random(64);
        $hashedToken = Hash::make($token);

        $user->remember_token = $hashedToken;
        $user->save();

        $resetUrl = config('app.frontend_url') . '/reset-password?token=' . $token . '&email=' . urlencode($data['email']);

        try {
            $user->notify(new ResetPasswordNotification($resetUrl));
        } catch (\Throwable $e) {
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'If the email exists, a reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        if (!$user->remember_token) {
            throw ValidationException::withMessages(['email' => ['No reset token found. Please request a new password reset.']]);
        }

        if (!Hash::check($data['token'], $user->remember_token)) {
            throw ValidationException::withMessages(['email' => ['Invalid reset token. Please request a new password reset.']]);
        }

        $user->password = Hash::make($data['password']);
        $user->remember_token = null;
        $user->save();
        
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset successfully.',
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'        => (string) $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'role'      => $user->role,
            'avatarUrl' => $user->avatar_url,
            'createdAt' => $user->created_at?->toISOString(),
        ];
    }
}
