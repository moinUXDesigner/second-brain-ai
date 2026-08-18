<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('finance_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('bucket', ['asset', 'loan', 'receivable', 'handloan']);
            $table->string('title');
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('counterparty')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->boolean('zakat_eligible')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'bucket']);
            $table->index(['user_id', 'status']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_entries');
    }
};
