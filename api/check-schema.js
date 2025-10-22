const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Tophill Portal'
  });
  
  console.log('Payments:');
  const [p] = await conn.query('DESCRIBE payments');
  const pid = p.find(c => c.Field === 'id');
  console.log('  id:', pid.Type, pid.Key, pid.Extra);
  
  console.log('\nFeeds:');
  const [f] = await conn.query('DESCRIBE feeds');
  const fid = f.find(c => c.Field === 'id');
  console.log('  id:', fid.Type, fid.Key, fid.Extra);
  
  console.log('\nNotifications:');
  const [n] = await conn.query('DESCRIBE notifications');
  const nid = n.find(c => c.Field === 'id');
  console.log('  id:', nid.Type, nid.Key, nid.Extra);
  
  await conn.end();
})();
