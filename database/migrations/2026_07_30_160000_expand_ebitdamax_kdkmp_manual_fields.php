<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                ALTER TABLE ebitdamax_kdkmp
                    ALTER COLUMN target_revenue TYPE VARCHAR(255) USING target_revenue::text,
                    ALTER COLUMN actual_revenue TYPE VARCHAR(255) USING actual_revenue::text,
                    ALTER COLUMN cost TYPE VARCHAR(255) USING cost::text,
                    ALTER COLUMN total_duration_minutes TYPE VARCHAR(255) USING total_duration_minutes::text,
                    ALTER COLUMN performance_score TYPE VARCHAR(255) USING performance_score::text
            SQL);
        } else {
            Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
                $table->string('target_revenue')->nullable()->change();
                $table->string('actual_revenue')->nullable()->change();
                $table->string('cost')->nullable()->change();
                $table->string('total_duration_minutes')->nullable()->change();
                $table->string('performance_score')->nullable()->change();
            });
        }

        Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->renameColumn('cost', 'actual_cost');
            $table->renameColumn('total_duration_minutes', 'total_duration');
            $table->renameColumn('performance_score', 'performance_scoring');
        });

        Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->string('plan_revenue')->nullable()->after('target_revenue');
            $table->string('target_cost')->nullable()->after('actual_revenue');
            $table->string('plan_cost')->nullable()->after('target_cost');
            $table->string('target_ebitda')->nullable()->after('actual_cost');
            $table->string('plan_ebitda')->nullable()->after('target_ebitda');
            $table->string('actual_ebitda')->nullable()->after('plan_ebitda');
            $table->string('target_ebitda_margin')->nullable()->after('actual_ebitda');
            $table->string('actual_ebitda_margin')->nullable()->after('target_ebitda_margin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
            $table->dropColumn([
                'plan_revenue',
                'target_cost',
                'plan_cost',
                'target_ebitda',
                'plan_ebitda',
                'actual_ebitda',
                'target_ebitda_margin',
                'actual_ebitda_margin',
            ]);
            $table->renameColumn('actual_cost', 'cost');
            $table->renameColumn('total_duration', 'total_duration_minutes');
            $table->renameColumn('performance_scoring', 'performance_score');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                ALTER TABLE ebitdamax_kdkmp
                    ALTER COLUMN target_revenue TYPE NUMERIC(20, 2)
                        USING CASE WHEN target_revenue ~ '^[+-]?[0-9]+([.][0-9]{1,2})?$' THEN target_revenue::numeric ELSE NULL END,
                    ALTER COLUMN actual_revenue TYPE NUMERIC(20, 2)
                        USING CASE WHEN actual_revenue ~ '^[+-]?[0-9]+([.][0-9]{1,2})?$' THEN actual_revenue::numeric ELSE NULL END,
                    ALTER COLUMN cost TYPE NUMERIC(20, 2)
                        USING CASE WHEN cost ~ '^[+-]?[0-9]+([.][0-9]{1,2})?$' THEN cost::numeric ELSE NULL END,
                    ALTER COLUMN total_duration_minutes TYPE INTEGER
                        USING CASE WHEN total_duration_minutes ~ '^[0-9]+$' THEN total_duration_minutes::integer ELSE NULL END,
                    ALTER COLUMN performance_score TYPE NUMERIC(5, 2)
                        USING CASE WHEN performance_score ~ '^[+-]?[0-9]+([.][0-9]{1,2})?$' THEN performance_score::numeric ELSE NULL END
            SQL);
        } else {
            Schema::table('ebitdamax_kdkmp', function (Blueprint $table) {
                $table->decimal('target_revenue', 20, 2)->nullable()->change();
                $table->decimal('actual_revenue', 20, 2)->nullable()->change();
                $table->decimal('cost', 20, 2)->nullable()->change();
                $table->unsignedInteger('total_duration_minutes')->nullable()->change();
                $table->decimal('performance_score', 5, 2)->nullable()->change();
            });
        }
    }
};
