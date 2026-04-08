<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    private string $apiKey;
    private string $model = 'gpt-4o-mini';

    public function __construct()
    {
        $this->apiKey = config('openai.api_key', env('OPENAI_API_KEY', ''));
    }

    public function analyzeInput(string $text, string $area = ''): ?array
    {
        if (!$this->apiKey) return null;

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'       => $this->model,
                    'temperature' => 0.2,
                    'messages'    => [
                        [
                            'role'    => 'system',
                            'content' => "You are a productivity assistant. Determine if input is a task or project.\nReturn ONLY valid JSON:\n{\"type\":\"task|project\",\"category\":\"Deep Work|Light Work|Admin|Recovery\",\"priority\":\"Low|Medium|High\",\"estimatedTime\":\"e.g. 30 minutes\",\"subtasks\":[]}"
                        ],
                        ['role' => 'user', 'content' => "Input: {$text}" . ($area ? "\nArea: {$area}" : '')],
                    ],
                ]);

            $content = $response->json('choices.0.message.content', '');
            $content = preg_replace('/```json|```/', '', $content);
            return json_decode(trim($content), true);
        } catch (\Throwable $e) {
            Log::warning('AIService::analyzeInput failed: ' . $e->getMessage());
            return null;
        }
    }

    public function classifyBatch(array $tasks): array
    {
        if (!$this->apiKey) return [];

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'       => $this->model,
                    'temperature' => 0.2,
                    'messages'    => [
                        [
                            'role'    => 'system',
                            'content' => "Classify each task. Return JSON array with: maslow, impact (1-10), effort (1-10). Return ONLY JSON array.",
                        ],
                        ['role' => 'user', 'content' => json_encode($tasks)],
                    ],
                ]);

            $content = $response->json('choices.0.message.content', '');
            $content = preg_replace('/```json|```/', '', $content);
            return json_decode(trim($content), true) ?? [];
        } catch (\Throwable $e) {
            Log::warning('AIService::classifyBatch failed: ' . $e->getMessage());
            return [];
        }
    }

    public function generateSubtasks(string $taskText, string $area = '', string $notes = ''): array
    {
        if (!$this->apiKey) return [];

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'       => $this->model,
                    'temperature' => 0.3,
                    'messages'    => [
                        [
                            'role'    => 'system',
                            'content' => 'Break the task into 4-6 clear actionable subtasks. Return ONLY a JSON array of strings.',
                        ],
                        ['role' => 'user', 'content' => "Task: {$taskText}\nArea: {$area}\nNotes: {$notes}"],
                    ],
                ]);

            $content = $response->json('choices.0.message.content', '');
            $content = preg_replace('/```json|```/', '', $content);
            $result  = json_decode(trim($content), true) ?? [];
            return array_map(fn($s) => is_string($s) ? $s : ($s['subtask'] ?? $s['title'] ?? json_encode($s)), $result);
        } catch (\Throwable $e) {
            Log::warning('AIService::generateSubtasks failed: ' . $e->getMessage());
            return [];
        }
    }
}
