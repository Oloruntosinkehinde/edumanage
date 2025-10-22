// Quick manual test of key endpoints
const http = require('http');

function test(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function run() {
  console.log('\n🔍 Testing Tophill Portal API...\n');

  // 1. Health check
  console.log('1. Health Check');
  const health = await test('/health');
  console.log(`   Status: ${health.status}, Data:`, health.data);

  // 2. Login
  console.log('\n2. Login as Admin');
  const login = await test('/auth/login', 'POST', { email: 'admin@Tophill Portal.com', password: 'password123' });
  console.log(`   Status: ${login.status}`);
  console.log(`   Response:`, JSON.stringify(login.data, null, 2));
  
  const token = login.data?.data?.accessToken;
  if (!token) {
    console.log('   ❌ No token received');
    return;
  }
  console.log(`   ✅ Token: ${token.substring(0, 30)}...`);

  // 3. Get students
  console.log('\n3. GET /students');
  const students = await test('/students', 'GET', null, token);
  console.log(`   Status: ${students.status}, Count: ${students.data?.length || 0}`);

  // 4. Get teachers
  console.log('\n4. GET /teachers');
  const teachers = await test('/teachers', 'GET', null, token);
  console.log(`   Status: ${teachers.status}, Count: ${teachers.data?.length || 0}`);

  // 5. Get subjects
  console.log('\n5. GET /subjects');
  const subjects = await test('/subjects', 'GET', null, token);
  console.log(`   Status: ${subjects.status}, Count: ${subjects.data?.length || 0}`);

  // 6. Get results
  console.log('\n6. GET /results');
  const results = await test('/results', 'GET', null, token);
  console.log(`   Status: ${results.status}, Count: ${results.data?.length || 0}`);

  // 7. Get payments
  console.log('\n7. GET /payments');
  const payments = await test('/payments', 'GET', null, token);
  console.log(`   Status: ${payments.status}, Count: ${payments.data?.length || 0}`);

  console.log('\n✅ All tests complete!\n');
}

run().catch(console.error);
