<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->integer('time_spent')->default(0)->after('time_estimate'); // in seconds
            $table->timestamp('timer_started_at')->nullable()->after('time_spent');
            $table->boolean('timer_running')->default(false)->after('timer_started_at');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['time_spent', 'timer_started_at', 'timer_running']);
        });
    }
};
