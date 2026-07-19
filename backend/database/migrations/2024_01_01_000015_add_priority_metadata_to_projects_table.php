<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('priority_mode')->default('auto');
            $table->integer('manual_priority')->nullable();
            $table->integer('auto_priority')->default(1);
            $table->string('maslow_level')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['priority_mode', 'manual_priority', 'auto_priority', 'maslow_level']);
        });
    }
};
