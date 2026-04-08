<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
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

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out']);
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
