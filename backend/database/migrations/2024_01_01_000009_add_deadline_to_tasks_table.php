<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('tasks', 'deadline_date')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->date('deadline_date')->nullable()->after('due_date');
            });
        }
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('deadline_date');
        });
    }
};
