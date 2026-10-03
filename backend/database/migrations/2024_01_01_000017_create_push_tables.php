<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');
            $table->string('endpoint_hash', 64)->unique();
            $table->string('public_key');
            $table->string('auth_token');
            $table->timestamps();
        });
        Schema::create('push_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('push_subscription_id')->constrained()->cascadeOnDelete();
            $table->json('payload');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('available_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_deliveries');
        Schema::dropIfExists('push_subscriptions');
    }
};
