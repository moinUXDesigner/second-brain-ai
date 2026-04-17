<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->integer('time_spent')->default(0); // in seconds
            $table->timestamp('timer_started_at')->nullable();
            $table->boolean('timer_running')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['time_spent', 'timer_started_at', 'timer_running']);
        });
    }
};
