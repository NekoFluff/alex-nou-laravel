<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('facility');
            $table->text('image');
            $table->integer('quantity_produced')->unsigned();
            $table->integer('time_to_produce')->unsigned();
            $table->timestamps();
        });
    }
};
