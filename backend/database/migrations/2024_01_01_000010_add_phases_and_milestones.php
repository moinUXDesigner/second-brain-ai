<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'phases')) {
                $table->json('phases')->nullable()->after('due_date');
            }
            if (!Schema::hasColumn('projects', 'milestones')) {
                $table->json('milestones')->nullable()->after('phases');
            }
        });

        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'phase_id')) {
                $table->string('phase_id')->nullable()->after('project_id');
            }
            if (!Schema::hasColumn('tasks', 'milestone_id')) {
                $table->string('milestone_id')->nullable()->after('phase_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'milestone_id')) {
                $table->dropColumn('milestone_id');
            }
            if (Schema::hasColumn('tasks', 'phase_id')) {
                $table->dropColumn('phase_id');
            }
        });

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'milestones')) {
                $table->dropColumn('milestones');
            }
            if (Schema::hasColumn('projects', 'phases')) {
                $table->dropColumn('phases');
            }
        });
    }
};
