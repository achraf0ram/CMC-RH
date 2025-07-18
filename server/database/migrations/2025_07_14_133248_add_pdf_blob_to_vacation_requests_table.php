<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE vacation_requests ADD pdf_blob LONGBLOB NULL AFTER file_path');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE vacation_requests DROP COLUMN pdf_blob');
    }
};
