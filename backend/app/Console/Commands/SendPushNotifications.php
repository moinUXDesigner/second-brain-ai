<?php

namespace App\Console\Commands;

use App\Services\PushService;
use Illuminate\Console\Command;

class SendPushNotifications extends Command
{
    protected $signature = 'push:send';

    protected $description = 'Deliver queued browser push notifications.';

    public function handle(PushService $push): int
    {
        $this->info('Delivered '.$push->flush().' push notification(s).');

        return self::SUCCESS;
    }
}
