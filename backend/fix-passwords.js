const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  console.log('Generated hash:', hash);

  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '2026',
    database: 'hr_training',
  });

  await client.connect();
  const res = await client.query('UPDATE users SET password_hash = $1', [hash]);
  console.log('Updated', res.rowCount, 'rows');
  await client.end();
}

main().catch(console.error);
