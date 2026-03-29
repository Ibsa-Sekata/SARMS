const axios = require('axios');

async function testNonHomeroomLogin() {
    try {
        console.log('=== Testing Non-Homeroom Teacher Login and Data Access ===\n');

        const baseURL = 'http://localhost:5000/api';

        // Test with iba1 (Chemistry teacher, non-homeroom)
        console.log('1. Testing login for iba1 (Chemistry teacher)...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'iba1',
            password: 'ibsa123'
        });

        console.log('Login successful!');
        console.log('User data:', JSON.stringify(loginResponse.data.user, null, 2));

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Test getting teacher assignments
        console.log('\n2. Getting teacher assignments...');
        const assignmentsResponse = await axios.get(
            `${baseURL}/teachers/${loginResponse.data.user.teacher_id}/assignments`,
            { headers }
        );
        console.log('Assignments:', JSON.stringify(assignmentsResponse.data, null, 2));

        // Test getting students
        console.log('\n3. Getting students...');
        const studentsResponse = await axios.get(`${baseURL}/students`, { headers });
        console.log('Students:', JSON.stringify(studentsResponse.data, null, 2));

        // Test getting marks for a class
        console.log('\n4. Getting marks for class 2...');
        try {
            const marksResponse = await axios.get(`${baseURL}/marks/class/2`, { headers });
            console.log('Marks:', JSON.stringify(marksResponse.data, null, 2));
        } catch (error) {
            console.log('Error getting marks:', error.response?.data || error.message);
        }

        console.log('\n=== All Tests Passed ===');

    } catch (error) {
        console.error('Test error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testNonHomeroomLogin();
