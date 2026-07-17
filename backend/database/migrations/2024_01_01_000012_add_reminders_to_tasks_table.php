<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'reminder_at')) {
                $table->timestamp('reminder_at')->nullable()->after('deadline_date');
            }
            if (!Schema::hasColumn('tasks', 'reminder_enabled')) {
                $table->boolean('reminder_enabled')->default(false)->after('reminder_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'reminder_enabled')) {
                $table->dropColumn('reminder_enabled');
            }
            if (Schema::hasColumn('tasks', 'reminder_at')) {
                $table->dropColumn('reminder_at');
            }
        });
    }
};
