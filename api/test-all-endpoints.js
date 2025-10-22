/**
 * Comprehensive API Endpoint Test Script
 * Tests all major endpoints with authentication
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logSection(message) {
  console.log('');
  log(`${'='.repeat(60)}`, 'blue');
  log(message, 'blue');
  log(`${'='.repeat(60)}`, 'blue');
}

// Test helper function
async function testEndpoint(name, method, url, data = null, requiresAuth = true) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      data,
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept all responses < 500
    };

    if (requiresAuth && authToken) {
      config.headers = { Authorization: `Bearer ${authToken}` };
    }

    const response = await axios(config);
    
    if (response.status >= 200 && response.status < 300) {
      logSuccess(`${name}: ${response.status} ${response.statusText}`);
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          logInfo(`  → Returned ${response.data.length} items`);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          logInfo(`  → Returned ${response.data.data.length} items`);
        } else {
          logInfo(`  → Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
      }

      return { success: true, data: response.data };
    } else {
      logError(`${name}: ${response.status} - ${response.data?.message || response.statusText}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    if (error.response) {
      logError(`${name}: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      logError(`${name}: Server not running (${error.message})`);
    } else {
      logError(`${name}: ${error.message}`);
    }
    return { success: false, error };
  }
}

async function runTests() {
  console.clear();
  logSection('Tophill Portal API Endpoint Tests');
  logInfo(`Base URL: ${BASE_URL}`);
  console.log('');

  // Track test results
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // 1. Health Check
  logSection('1. Health Check');
  const health = await testEndpoint('Health Check', 'GET', '/health', null, false);
  results.total++;
  if (health.success) results.passed++;
  else results.failed++;

  // 2. Authentication
  logSection('2. Authentication Tests');
  
  // Login as Admin
  const login = await testEndpoint(
    'Admin Login',
    'POST',
    '/auth/login',
    {
      email: 'admin@Tophill Portal.com',
      password: 'password123'
    },
    false
  );
  results.total++;
  
  if (login.success && login.data.data && login.data.data.accessToken) {
    authToken = login.data.data.accessToken;
    logInfo(`  → Token received: ${authToken.substring(0, 30)}...`);
    results.passed++;
  } else {
    results.failed++;
    logError('Failed to get auth token. Remaining tests will fail.');
    return;
  }

  // Get current user profile
  const profile = await testEndpoint('Get Profile', 'GET', '/auth/profile');
  results.total++;
  if (profile.success) results.passed++;
  else results.failed++;

  // 3. Students Endpoints
  logSection('3. Students Endpoints');
  
  const students = await testEndpoint('GET /students', 'GET', '/students');
  results.total++;
  if (students.success) results.passed++;
  else results.failed++;

  if (students.success && students.data && students.data.length > 0) {
    const studentId = students.data[0].id;
    const studentDetail = await testEndpoint(`GET /students/${studentId}`, 'GET', `/students/${studentId}`);
    results.total++;
    if (studentDetail.success) results.passed++;
    else results.failed++;
  }

  // 4. Teachers Endpoints
  logSection('4. Teachers Endpoints');
  
  const teachers = await testEndpoint('GET /teachers', 'GET', '/teachers');
  results.total++;
  if (teachers.success) results.passed++;
  else results.failed++;

  if (teachers.success && teachers.data && teachers.data.length > 0) {
    const teacherId = teachers.data[0].id;
    const teacherDetail = await testEndpoint(`GET /teachers/${teacherId}`, 'GET', `/teachers/${teacherId}`);
    results.total++;
    if (teacherDetail.success) results.passed++;
    else results.failed++;
  }

  // 5. Subjects Endpoints
  logSection('5. Subjects Endpoints');
  
  const subjects = await testEndpoint('GET /subjects', 'GET', '/subjects');
  results.total++;
  if (subjects.success) results.passed++;
  else results.failed++;

  if (subjects.success && subjects.data && subjects.data.length > 0) {
    const subjectId = subjects.data[0].id;
    const subjectDetail = await testEndpoint(`GET /subjects/${subjectId}`, 'GET', `/subjects/${subjectId}`);
    results.total++;
    if (subjectDetail.success) results.passed++;
    else results.failed++;
  }

  // 6. Results Endpoints
  logSection('6. Results Endpoints');
  
  const results_list = await testEndpoint('GET /results', 'GET', '/results');
  results.total++;
  if (results_list.success) results.passed++;
  else results.failed++;

  if (results_list.success && results_list.data && results_list.data.length > 0) {
    const resultId = results_list.data[0].id;
    const resultDetail = await testEndpoint(`GET /results/${resultId}`, 'GET', `/results/${resultId}`);
    results.total++;
    if (resultDetail.success) results.passed++;
    else results.failed++;

    // Test results by student
    const studentId = results_list.data[0].student_id;
    const studentResults = await testEndpoint(`GET /results/student/${studentId}`, 'GET', `/results/student/${studentId}`);
    results.total++;
    if (studentResults.success) results.passed++;
    else results.failed++;
  }

  // 7. Payments Endpoints
  logSection('7. Payments Endpoints');
  
  const payments = await testEndpoint('GET /payments', 'GET', '/payments');
  results.total++;
  if (payments.success) results.passed++;
  else results.failed++;

  if (payments.success && payments.data && payments.data.length > 0) {
    const paymentId = payments.data[0].id;
    const paymentDetail = await testEndpoint(`GET /payments/${paymentId}`, 'GET', `/payments/${paymentId}`);
    results.total++;
    if (paymentDetail.success) results.passed++;
    else results.failed++;

    // Test payments by student
    const studentId = payments.data[0].student_id;
    const studentPayments = await testEndpoint(`GET /payments/student/${studentId}`, 'GET', `/payments/student/${studentId}`);
    results.total++;
    if (studentPayments.success) results.passed++;
    else results.failed++;
  }

  // 8. Feeds Endpoints
  logSection('8. Feeds Endpoints');
  
  const feeds = await testEndpoint('GET /feeds', 'GET', '/feeds');
  results.total++;
  if (feeds.success) results.passed++;
  else results.failed++;

  if (feeds.success && feeds.data && feeds.data.length > 0) {
    const feedId = feeds.data[0].id;
    const feedDetail = await testEndpoint(`GET /feeds/${feedId}`, 'GET', `/feeds/${feedId}`);
    results.total++;
    if (feedDetail.success) results.passed++;
    else results.failed++;
  }

  // 9. Notifications Endpoints
  logSection('9. Notifications Endpoints');
  
  const notifications = await testEndpoint('GET /notifications', 'GET', '/notifications');
  results.total++;
  if (notifications.success) results.passed++;
  else results.failed++;

  // 10. Users Endpoints (Admin only)
  logSection('10. Users Endpoints (Admin)');
  
  const users = await testEndpoint('GET /users', 'GET', '/users');
  results.total++;
  if (users.success) results.passed++;
  else results.failed++;

  // Final Summary
  logSection('Test Results Summary');
  console.log('');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  const percentage = ((results.passed / results.total) * 100).toFixed(1);
  console.log('');
  if (results.failed === 0) {
    logSuccess(`🎉 All tests passed! (${percentage}%)`);
  } else {
    log(`⚠️  ${percentage}% tests passed`, 'yellow');
  }
  console.log('');
}

// Run all tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
