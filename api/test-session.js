const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;
const BASE_PATH = '/api';

// Store session cookie
let sessionCookie = null;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: `${BASE_PATH}${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add session cookie if we have one
    if (sessionCookie) {
      options.headers['Cookie'] = sessionCookie;
    }

    const req = http.request(options, (res) => {
      let data = '';

      // Capture session cookie from response
      if (res.headers['set-cookie']) {
        sessionCookie = res.headers['set-cookie'][0].split(';')[0];
        console.log('   Session cookie received');
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testAPI() {
  console.log('🔍 Testing Tophill Portal API with Session Auth...\n');

  try {
    // Test 1: Health Check
    console.log('1. Health Check');
    const health = await makeRequest('GET', '/health');
    console.log(`   Status: ${health.status}, Data:`, health.data);

    // Test 2: Login
    console.log('\n2. Login as Admin');
    const login = await makeRequest('POST', '/auth/login', {
      email: 'admin@Tophill Portal.com',
      password: 'password123'
    });
    console.log(`   Status: ${login.status}`);
    if (login.data.success) {
      console.log('   ✅ Login successful!');
      console.log('   User:', login.data.data.user);
    } else {
      console.log('   ❌ Login failed:', login.data);
      return;
    }

    // Test 3: Get current user (me)
    console.log('\n3. Get Current User');
    const me = await makeRequest('GET', '/auth/me');
    console.log(`   Status: ${me.status}`);
    console.log('   Data:', me.data);

    // Test 4: Get students
    console.log('\n4. Get Students');
    const students = await makeRequest('GET', '/students');
    console.log(`   Status: ${students.status}`);
    if (students.data.success) {
      console.log(`   ✅ Found ${students.data.data.students?.length || 0} students`);
    } else {
      console.log('   Response:', students.data);
    }

    // Test 5: Get teachers
    console.log('\n5. Get Teachers');
    const teachers = await makeRequest('GET', '/teachers');
    console.log(`   Status: ${teachers.status}`);
    if (teachers.data.success) {
      console.log(`   ✅ Found ${teachers.data.data.teachers?.length || 0} teachers`);
    } else {
      console.log('   Response:', teachers.data);
    }

    // Test 6: Get subjects
    console.log('\n6. Get Subjects');
    const subjects = await makeRequest('GET', '/subjects');
    console.log(`   Status: ${subjects.status}`);
    if (subjects.data.success) {
      console.log(`   ✅ Found ${subjects.data.data.subjects?.length || 0} subjects`);
    } else {
      console.log('   Response:', subjects.data);
    }

    // Test 7: Logout
    console.log('\n7. Logout');
    const logout = await makeRequest('POST', '/auth/logout');
    console.log(`   Status: ${logout.status}`);
    console.log('   Data:', logout.data);

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testAPI();
