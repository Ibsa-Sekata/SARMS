const axios = require('axios');

async function testLiveLogin() {
    try {
        console.log('Testing live login and data access...\n');

        const baseURL = 'http://localhost:5000/api';

        // Login as iba1
        console.log('1. Logging in as iba1...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'iba1',
            password: 'ibsa123'
        });

        console.log('Login response:');
        console.log(JSON.stringify(loginResponse.data, null, 2));

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        const headers = { Authorization: `Bearer ${token}` };

        // Get teacher assignments
        console.log('\n2. Getting teacher assignments...');
        const assignmentsResponse = await axios.get(
            `${baseURL}/teachers/${user.teacher_id}/assignments`,
            { headers }
        );
        console.log('Assignments response:');
        console.log(JSON.stringify(assignmentsResponse.data, null, 2));

        // Get students
        console.log('\n3. Getting students...');
        const studentsResponse = await axios.get(`${baseURL}/students`, { headers });
        console.log('Students response:');
        console.log(JSON.stringify(studentsResponse.data, null, 2));

        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

testLiveLogin();
