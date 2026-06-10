const { Client } = require('pg');

async function fix() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '2026',
    database: 'hr_training',
  });

  await client.connect();

  // Fix formations
  await client.query(
    `UPDATE formations SET name=$1, description=$2, domain=$3 WHERE id=$4`,
    ['React Avancé', 'Formation avancée React avec hooks, context et patterns', 'Développement Web', 'b0000000-0000-0000-0000-000000000001']
  );
  await client.query(
    `UPDATE formations SET description=$1, domain=$2 WHERE id=$3`,
    ['Introduction à NestJS et architecture modulaire', 'Développement Backend', 'b0000000-0000-0000-0000-000000000002']
  );
  await client.query(
    `UPDATE formations SET description=$1, domain=$2 WHERE id=$3`,
    ['Administration et optimisation PostgreSQL', 'Base de données', 'b0000000-0000-0000-0000-000000000003']
  );
  await client.query(
    `UPDATE formations SET description=$1 WHERE id=$2`,
    ['Méthodologies Scrum et Kanban', 'b0000000-0000-0000-0000-000000000004']
  );

  // Also fix any training requests with corrupted names
  await client.query(`
    UPDATE training_requests SET custom_formation_name = 
      REPLACE(REPLACE(REPLACE(REPLACE(custom_formation_name, 
        'Ã©', 'é'), 'Ã¨', 'è'), 'Ã ', 'à'), 'Ã®', 'î')
    WHERE custom_formation_name LIKE '%Ã%'
  `);

  const check = await client.query('SELECT id, name, domain FROM formations');
  console.log('Fixed formations:');
  check.rows.forEach(r => console.log(`  ${r.name} [${r.domain}]`));

  await client.end();
  console.log('Done!');
}

fix().catch(e => { console.error(e); process.exit(1); });
