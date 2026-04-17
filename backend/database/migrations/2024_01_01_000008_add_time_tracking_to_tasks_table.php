<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'time_spent')) {
                $table->integer('time_spent')->default(0); // in seconds
            }
            if (!Schema::hasColumn('tasks', 'timer_started_at')) {
                $table->timestamp('timer_started_at')->nullable();
            }
            if (!Schema::hasColumn('tasks', 'timer_running')) {
                $table->boolean('timer_running')->default(false);
            }
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'time_spent')) {
                $table->dropColumn('time_spent');
            }
            if (Schema::hasColumn('tasks', 'timer_started_at')) {
                $table->dropColumn('timer_started_at');
            }
            if (Schema::hasColumn('tasks', 'timer_running')) {
                $table->dropColumn('timer_running');
            }
        });
    }
};
