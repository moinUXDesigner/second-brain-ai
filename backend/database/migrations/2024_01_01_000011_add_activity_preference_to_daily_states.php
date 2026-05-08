<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('daily_states', function (Blueprint $table) {
            $table->string('activity_preference')->default('Any')->after('available_time');
        });
    }

    public function down(): void
    {
        Schema::table('daily_states', function (Blueprint $table) {
            $table->dropColumn('activity_preference');
        });
    }
};
