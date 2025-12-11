const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function getDatabaseUrl() {
  // Try environment first
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // Fallback: read .env.local in project root
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/DATABASE_URL\s*=\s*"([^"]+)"/);
  if (match) return match[1];
  return null;
}

(async function main() {
  try {
    const DATABASE_URL = getDatabaseUrl();
    if (!DATABASE_URL) {
      console.error('DATABASE_URL not found in environment or .env.local');
      process.exit(1);
    }

    const migrationsDir = path.resolve(__dirname, '..', 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error('No prisma/migrations directory found');
      process.exit(1);
    }

    const entries = fs.readdirSync(migrationsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();

    if (entries.length === 0) {
      console.log('No migrations to apply');
      process.exit(0);
    }

    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    for (const dir of entries) {
      const sqlPath = path.join(migrationsDir, dir, 'migration.sql');
      if (!fs.existsSync(sqlPath)) {
        console.log(`Skipping ${dir} (no migration.sql)`);
        continue;
      }
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(`Applying migration ${dir}...`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✓ Applied ${dir}`);
      } catch (err) {
        await client.query('ROLLBACK');
        // Check if error is due to already-applied migration (idempotent check)
        const errMsg = err.message || '';
        if (errMsg.includes('already exists') || errMsg.includes('duplicate')) {
          console.log(`⊘ Skipped ${dir} (already applied)`);
        } else {
          console.error(`✗ Failed to apply ${dir}:`, errMsg);
          // Continue to next migration instead of exiting
        }
      }
    }

    await client.end();
    console.log('✓ Migration process completed');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
