<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('type')->default('Task');
            $table->string('area')->nullable();
            $table->text('notes')->nullable();
            $table->string('maslow')->nullable();
            $table->integer('impact')->default(0);
            $table->integer('effort')->default(0);
            $table->string('time_estimate')->nullable();
            $table->string('urgency')->nullable();
            $table->string('category')->nullable();
            $table->float('confidence')->default(0);
            $table->integer('priority')->default(0);
            $table->float('fit_score')->default(0);
            $table->enum('status', ['Pending', 'Done', 'Deleted', 'Idea', 'Note'])->default('Pending');
            $table->string('source')->nullable();
            $table->enum('recurrence', ['Daily', 'Weekly', 'Monthly', 'Yearly'])->nullable();
            $table->date('due_date')->nullable();
            $table->json('tags')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
