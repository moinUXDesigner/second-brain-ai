<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('work_type')->nullable();
            $table->string('routine_type')->nullable();
            $table->string('commute_time')->nullable();
            $table->boolean('use_personal_data')->default(false);
            $table->string('age')->nullable();
            $table->date('dob')->nullable();
            $table->string('financial_status')->nullable();
            $table->string('health_status')->nullable();
            $table->text('custom_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action');
            $table->string('entity_type');
            $table->string('entity_id')->nullable();
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->enum('severity', ['info', 'warning', 'critical'])->default('info');
            $table->string('session_id');
            $table->timestamp('timestamp')->useCurrent();
            $table->timestamps();
        });

        Schema::create('today_view', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->integer('priority')->default(0);
            $table->float('fit_score')->default(0);
            $table->string('category')->nullable();
            $table->enum('status', ['Pending', 'Done'])->default('Pending');
            $table->date('date');
            $table->timestamps();
        });

        Schema::create('ai_cache', function (Blueprint $table) {
            $table->id();
            $table->string('hash')->unique();
            $table->text('task_text');
            $table->string('maslow')->nullable();
            $table->integer('impact')->nullable();
            $table->integer('effort')->nullable();
            $table->json('subtasks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_cache');
        Schema::dropIfExists('today_view');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('profiles');
    }
};
