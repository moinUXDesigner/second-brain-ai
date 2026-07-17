<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('task_reminder_logs')) {
            Schema::create('task_reminder_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('task_id')->constrained()->cascadeOnDelete();
                $table->string('kind');
                $table->string('reminder_key');
                $table->timestamp('notified_at');
                $table->timestamps();
                $table->unique(['user_id', 'task_id', 'kind', 'reminder_key'], 'task_reminder_logs_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('task_reminder_logs');
    }
};
