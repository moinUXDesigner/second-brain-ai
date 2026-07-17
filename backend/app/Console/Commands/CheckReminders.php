<?php

namespace App\Console\Commands;

use App\Services\ReminderService;
use Illuminate\Console\Command;

class CheckReminders extends Command
{
    protected $signature = 'reminders:check';
    protected $description = 'Generate due in-app task reminder notifications.';

    public function handle(ReminderService $reminders): int
    {
        $created = $reminders->checkAllUsers();
        $this->info("Created {$created} reminder notification(s).");

        return self::SUCCESS;
    }
}
