// Simple smoke tests for authentication endpoints
// Run with: node tests/auth.test.js

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'testpass123',
  phone: '+1234567890'
};

let authToken = '';
let refreshToken = '';

// Helper function to make requests
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status 
    };
  }
}

// Test functions
async function testClientRegistration() {
  console.log('🧪 Testing client registration...');
  
  const result = await makeRequest('POST', '/client/register', testUser);
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    refreshToken = result.data.refreshToken;
    console.log('✅ Registration successful');
    console.log(`   User ID: ${result.data.user.id}`);
    console.log(`   Email: ${result.data.user.email}`);
    return true;
  } else {
    console.log('❌ Registration failed:', result.error);
    return false;
  }
}

async function testClientLogin() {
  console.log('🧪 Testing client login...');
  
  const result = await makeRequest('POST', '/client/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    refreshToken = result.data.refreshToken;
    console.log('✅ Login successful');
    console.log(`   Token expires in: ${result.data.expires_in} seconds`);
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

async function testProtectedRoute() {
  console.log('🧪 Testing protected route access...');
  
  const result = await makeRequest('GET', '/client/profile', null, authToken);
  
  if (result.success) {
    console.log('✅ Protected route access successful');
    console.log(`   Profile name: ${result.data.name}`);
    console.log(`   Profile email: ${result.data.email}`);
    return true;
  } else {
    console.log('❌ Protected route access failed:', result.error);
    return false;
  }
}

async function testProfileUpdate() {
  console.log('🧪 Testing profile update...');
  
  const updateData = {
    name: 'Updated Test User',
    phone: '+9876543210'
  };
  
  const result = await makeRequest('PUT', '/client/profile', updateData, authToken);
  
  if (result.success) {
    console.log('✅ Profile update successful');
    console.log(`   Updated name: ${result.data.user.name}`);
    return true;
  } else {
    console.log('❌ Profile update failed:', result.error);
    return false;
  }
}

async function testTokenRefresh() {
  console.log('🧪 Testing token refresh...');
  
  const result = await makeRequest('POST', '/client/refresh', { refreshToken });
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Token refresh successful');
    console.log(`   New token expires in: ${result.data.expires_in} seconds`);
    return true;
  } else {
    console.log('❌ Token refresh failed:', result.error);
    return false;
  }
}

async function testLogout() {
  console.log('🧪 Testing logout...');
  
  const result = await makeRequest('POST', '/client/logout', { refreshToken }, authToken);
  
  if (result.success) {
    console.log('✅ Logout successful');
    return true;
  } else {
    console.log('❌ Logout failed:', result.error);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('🧪 Testing unauthorized access (should fail)...');
  
  const result = await makeRequest('GET', '/client/profile');
  
  if (!result.success && result.status === 401) {
    console.log('✅ Unauthorized access properly blocked');
    return true;
  } else {
    console.log('❌ Unauthorized access not properly blocked');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Authentication System Tests\n');
  
  const tests = [
    testClientRegistration,
    testClientLogin,
    testProtectedRoute,
    testProfileUpdate,
    testTokenRefresh,
    testLogout,
    testUnauthorizedAccess
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('❌ Test error:', error.message);
      failed++;
    }
    console.log(''); // Empty line between tests
  }
  
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Authentication system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
