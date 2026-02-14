/**
 * Script to apply admin subscription RPC migrations
 * Usage: node scripts/apply-admin-subscription-rpcs.js
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    // For RPC function creation, we need to execute the SQL directly
    // Split by statement separator (double newline or CREATE OR REPLACE FUNCTION)
    const statements = sql
      .split(/(?=CREATE OR REPLACE FUNCTION)|(?=COMMENT ON FUNCTION)/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (!statement) continue;

      // Try to execute using Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: statement }),
      }).catch(() => null);

      if (!response || !response.ok) {
        console.log('ℹ️  Direct REST API not available, trying alternative method...');
        console.log('   Please apply this migration manually via Supabase SQL Editor:');
        console.log('   Dashboard → SQL Editor → New Query → Paste the migration SQL');
        console.log(`\n   Migration file: supabase/migrations/${fileName}\n`);
        return false;
      }
    }

    console.log(`✅ Migration applied successfully: ${fileName}`);
    return true;
  } catch (err) {
    console.error(`❌ Error applying migration: ${fileName}`);
    console.error(`   ${err.message}`);
    console.log('\n   Please apply this migration manually via Supabase SQL Editor:');
    console.log('   Dashboard → SQL Editor → New Query → Paste the migration SQL');
    console.log(`   Migration file: supabase/migrations/${fileName}\n`);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Applying Admin Subscription RPC Migrations...\n');

  const migrations = [
    '20260214000001_add_admin_create_subscription_rpc.sql',
    '20260214000002_add_admin_update_subscription_rpc.sql',
    '20260214000003_add_admin_extend_subscription_rpc.sql',
  ];

  console.log('⚠️  Note: These migrations create PostgreSQL functions (RPCs).');
  console.log('   If automatic application fails, please apply manually via Supabase Dashboard.\n');

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
    console.log('📋 Manual Application Instructions:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Navigate to: SQL Editor');
    console.log('   3. Click "New Query"');
    console.log('   4. For each failed migration:');
    console.log('      - Open the migration file from supabase/migrations/');
    console.log('      - Copy the entire SQL content');
    console.log('      - Paste into SQL Editor');
    console.log('      - Click "Run"');
    console.log('\n   Migration files:');
    migrations.forEach(m => console.log(`      - supabase/migrations/${m}`));
    console.log('');
  } else {
    console.log('🎉 All migrations applied successfully!\n');
  }
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
