const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const envPath = require('path').resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const m = content.match(/DATABASE_URL\s*=\s*"([^"]+)"/);
  const DATABASE_URL = m && m[1];
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='Reservation' ORDER BY ordinal_position");
  console.log('columns for table Reservation:');
  console.table(res.rows);
  await client.end();
}

main().catch(err=>{console.error(err); process.exit(1);});
