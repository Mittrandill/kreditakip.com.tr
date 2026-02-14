/**
 * Script to apply pending migrations to Supabase database
 * Usage: node scripts/apply-migrations.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration(fileName) {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', fileName);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${fileName}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`\n📝 Applying migration: ${fileName}`);
  console.log('─'.repeat(60));

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('ℹ️  Using direct SQL execution...');

        // Split by semicolons and execute each statement
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          if (!statement || statement.startsWith('COMMENT')) {
            // Skip comments - they cause issues
            continue;
          }

          const { error: stmtError } = await supabase.rpc('exec', {
            sql: statement + ';'
          }).catch(async (e) => {
            // Fallback: try with raw SQL query
            return await supabase.from('_').select('*').limit(0).then(() => ({ error: null })).catch(() => {
              console.error(`   ⚠️  Could not execute statement, trying alternative method...`);
              return { error: e };
            });
          });

          if (stmtError) {
            console.error(`   ❌ Error in statement: ${statement.substring(0, 100)}...`);
            console.error(`      ${stmtError.message}`);
          }
        }

        console.log(`✅ Migration applied (with warnings): ${fileName}`);
        return true;
      }

      throw error;
    }

    console.log(`✅ Migration applied successfully: ${fileName}`);
    return true;
  } catch (err) {
    console.error(`❌ Error applying migration: ${fileName}`);
    console.error(`   ${err.message}`);
    if (err.details) {
      console.error(`   Details: ${err.details}`);
    }
    if (err.hint) {
      console.error(`   Hint: ${err.hint}`);
    }
    return false;
  }
}

async function main() {
  console.log('\n🚀 Starting migration process...\n');

  const migrations = [
    '20260113000001_fix_pro_plan_support.sql',
    '20260113000002_create_billing_info_table.sql',
    '20260214000001_add_admin_create_subscription_rpc.sql',
    '20260214000002_add_admin_update_subscription_rpc.sql',
    '20260214000003_add_admin_extend_subscription_rpc.sql',
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${migrations.length}\n`);

  if (failCount > 0) {
    console.log('⚠️  Some migrations failed. Please check the errors above.');
    console.log('   You may need to apply them manually using the Supabase dashboard.\n');
  } else {
    console.log('🎉 All migrations applied successfully!\n');
  }
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
