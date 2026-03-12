const axios = require('axios');

async function testRegistration() {
  try {
    const res = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      collegeId: '12345',
      department: 'CS',
      year: 1
    });
    console.log('Registration Success:', res.data);
  } catch (err) {
    console.error('Registration Failed:', err.response?.data || err.message);
  }
}

testRegistration();
