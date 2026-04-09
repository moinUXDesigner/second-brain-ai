<?php

namespace App\Services;

class ClassificationService
{
    public function classify(string $task, string $userType = ''): array
    {
        $text = strtolower($task);
        $maslow = 'Self-Actualization';
        $impact = 5;
        $effort = 4;
        $confidence = 0.4;
        $isComplex = false;

        if (preg_match('/pay|bill|invoice|tax|gst|expense|budget|investment/', $text)) {
            $maslow = 'Safety'; $impact = 8; $effort = 2; $confidence += 0.4;
        }
        if (preg_match('/call|email|message|meet|follow up|contact/', $text)) {
            $maslow = 'Love'; $impact = 6; $effort = 2; $confidence += 0.4;
        }
        if (preg_match('/doctor|health|sleep|gym|exercise|walk|meditation|diet/', $text)) {
            $maslow = 'Physiological'; $impact = 9; $effort = 3; $confidence += 0.4;
        }
        if (preg_match('/fix|repair|clean|organize|maintenance|service/', $text)) {
            $maslow = 'Safety'; $impact = 8; $effort = 5; $confidence += 0.4;
        }
        if (preg_match('/learn|study|read|course|practice|tutorial/', $text)) {
            $maslow = 'Esteem'; $impact = 7; $effort = 5; $confidence += 0.3;
        }
        if (preg_match('/build|create|develop|launch|mvp|startup|product/', $text)) {
            $maslow = 'Self-Actualization'; $impact = 9; $effort = 7; $confidence += 0.3; $isComplex = true;
        }
        if (preg_match('/resume|interview|job|internship|networking/', $text)) {
            $maslow = 'Esteem'; $impact = 8; $effort = 5; $confidence += 0.3;
        }
        if (preg_match('/family|friend|parents|birthday|relationship/', $text)) {
            $maslow = 'Love'; $impact = 7; $effort = 2; $confidence += 0.3;
        }
        if (preg_match('/write|blog|video|content|youtube|record|edit/', $text)) {
            $maslow = 'Esteem'; $impact = 7; $effort = 6; $confidence += 0.3;
        }
        if (str_contains($text, ' and ') || str_contains($text, ' then ') || strlen($text) > 80) {
            $isComplex = true; $confidence -= 0.2;
        }

        // Long multi-word tasks are always complex
        if (str_word_count($text) > 10) {
            $isComplex = true;
            $effort    = max($effort, 7);
            $confidence = min($confidence - 0.1, 0.5);
        }

        return [
            'maslow'     => $maslow,
            'impact'     => $impact,
            'effort'     => $effort,
            'confidence' => min(max($confidence, 0), 1),
            'is_complex' => $isComplex,
        ];
    }

    public function deriveTime(string $task): string
    {
        $text  = strtolower($task);
        $words = str_word_count($text);

        // Multi-step / deployment / complex project signals → days
        if (preg_match('/deploy|launch|release|go.live|subdomain|hosting|production/', $text)) return '1 day';
        if (preg_match('/finalize|complete|finish|deliver|ship/', $text) && $words > 8) return '4 hours';

        // Development / build work
        if (preg_match('/build|develop|create|implement|migrate|redesign|refactor/', $text)) {
            return $words > 10 ? '1 day' : '2 hours';
        }

        // Writing / content
        if (preg_match('/write|prepare|design|plan|setup/', $text)) return '1 hour';

        // Quick tasks
        if (preg_match('/call|email|message|reply|send/', $text)) return '10 mins';
        if (preg_match('/read|review|check|verify/', $text)) return '20 mins';

        // Long text = complex task
        if ($words > 12) return '2 hours';
        if ($words > 7)  return '1 hour';

        return '30 mins';
    }

    public function deriveUrgency(string $task): string
    {
        $text = strtolower($task);
        if (str_contains($text, 'today') || str_contains($text, 'urgent')) return 'High';
        if (str_contains($text, 'week')) return 'Low';
        return 'Medium';
    }

    public function deriveType(string $task, string $userType = ''): string
    {
        if ($userType) return $userType;
        $text = strtolower($task);
        if (str_contains($text, 'fix') || str_contains($text, 'issue')) return 'Problem';
        if (str_contains($text, 'idea')) return 'Idea';
        if (str_contains($text, 'plan') || str_contains($text, 'build')) return 'Project';
        return 'Task';
    }

    public function calculatePriority(string $maslow, int $impact, int $effort, string $urgency): int
    {
        $maslowWeight = match ($maslow) {
            'Physiological' => 5,
            'Safety'        => 4,
            'Love'          => 3,
            'Esteem'        => 2,
            default         => 1,
        };
        $urgencyWeight = match ($urgency) {
            'High'   => 5,
            'Medium' => 3,
            'Low'    => 1,
            default  => 2,
        };
        return (int) round(($impact * 2) + $maslowWeight + $urgencyWeight - $effort);
    }

    public function calculateFitScore(int $effort, string $timeEstimate, int $energy, int $mood, int $focus): float
    {
        $energyLevel = $this->toLevel($energy);
        $moodLevel   = $this->toLevel($mood);
        $focusLevel  = $this->toLevel($focus);
        $fitScore    = 5;

        if ($energyLevel === 'Low') {
            if ($effort <= 3) $fitScore += 3;
            if ($effort >= 7) $fitScore -= 3;
        }
        if ($energyLevel === 'Medium' && $effort >= 4 && $effort <= 6) $fitScore += 2;
        if ($energyLevel === 'High') { $fitScore += 1; if ($effort >= 6) $fitScore += 2; }

        if ($focusLevel === 'Low') {
            if (str_contains($timeEstimate, 'hour')) $fitScore -= 2;
            if (str_contains($timeEstimate, 'min'))  $fitScore += 2;
        }
        if ($focusLevel === 'High' && str_contains($timeEstimate, 'hour')) $fitScore += 2;

        if ($moodLevel === 'Low') {
            if ($effort >= 6) $fitScore -= 2;
            if ($effort <= 3) $fitScore += 1;
        }
        if ($moodLevel === 'High') $fitScore += 1;

        return max(1, min(10, $fitScore));
    }

    public function getCategory(int $priority, float $fitScore, string $energy): string
    {
        if ($energy === 'Low' && $priority >= 18) return 'Critical (Reschedule or Delegate)';
        if ($priority >= 18) return 'Critical';
        if ($priority >= 15) return 'Must Do';
        if ($fitScore >= 6 || $priority >= 12) return 'Can Do Now';
        return 'Optional';
    }

    public function looksLikeProject(string $text): bool
    {
        $lower = strtolower($text);
        $words = str_word_count($lower);

        $keywords = [
            'build', 'create', 'design', 'develop', 'launch', 'plan', 'setup',
            'implement', 'redesign', 'migrate', 'app', 'website', 'system',
            'platform', 'project', 'deploy', 'finalize', 'complete', 'deliver',
            'release', 'ship', 'integrate', 'configure', 'install', 'subdomain',
            'hosting', 'domain', 'server', 'api', 'database', 'backend', 'frontend',
        ];

        $count = 0;
        foreach ($keywords as $kw) {
            if (str_contains($lower, $kw)) $count++;
        }

        // Long descriptive text with multi-step verbs = project
        $multiStepVerbs = preg_match('/and|then|also|with|including|plus/', $lower);

        return $count >= 2 || ($count >= 1 && $words > 8) || ($multiStepVerbs && $words > 10);
    }

    public function generateSubtasks(string $taskText): array
    {
        $text = strtolower($taskText);
        if (preg_match('/repair|fix/', $text)) {
            return ['Inspect the issue', 'Identify required tools or technician', 'Fix the problem', 'Test and verify functionality'];
        }
        if (preg_match('/build|create/', $text)) {
            return ['Define requirements', 'Plan the approach', 'Execute development', 'Test and finalize'];
        }
        if (preg_match('/startup|business/', $text)) {
            return ['Research market', 'Define product/service', 'Build MVP', 'Launch and collect feedback'];
        }
        if (preg_match('/learn|study/', $text)) {
            return ['Identify learning resources', 'Create study plan', 'Practice regularly', 'Review and test knowledge'];
        }
        return ['Break down the task', 'Execute step 1', 'Execute step 2', 'Complete and review'];
    }

    public function parseTimeEstimate(string $str, int $effort = 5): int
    {
        if (!$str) {
            if ($effort <= 3) return 30;
            if ($effort <= 6) return 60;
            return 120;
        }
        $s = strtolower(trim($str));
        $total = 0;
        if (preg_match('/(\d+\.?\d*)\s*h(?:ours?|r)?/', $s, $m)) $total += (float)$m[1] * 60;
        if (preg_match('/(\d+)\s*m(?:in(?:utes?)?)?/', $s, $m)) $total += (int)$m[1];
        if ($total === 0) {
            $num = (float)$s;
            if ($num > 0) return (int)$num;
            if ($effort <= 3) return 30;
            if ($effort <= 6) return 60;
            return 120;
        }
        return (int)$total;
    }

    private function toLevel(int $val): string
    {
        if ($val <= 3) return 'Low';
        if ($val <= 6) return 'Medium';
        return 'High';
    }
}
