const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing vendor login...');
    const response = await axios.post('http://localhost:5000/api/vendor/login', {
      email: 'vendor@test.com',
      password: 'password123'
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testLogin();
