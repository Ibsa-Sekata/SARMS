const axios = require('axios');

async function testRosterGeneration() {
    try {
        console.log('=== Testing Roster Generation ===\n');

        const baseURL = 'http://localhost:5000/api';

        // Login as homeroom teacher (ibsa0)
        console.log('1. Logging in as homeroom teacher (ibsa0)...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'ibsa0',
            password: 'ibsa123'
        });

        console.log('Login successful!');
        console.log('User:', JSON.stringify(loginResponse.data.user, null, 2));

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        const headers = { Authorization: `Bearer ${token}` };

        if (!user.homeroom_class_id) {
            console.error('❌ User is not a homeroom teacher or has no class assigned');
            return;
        }

        // Get current settings
        console.log('\n2. Getting current academic settings...');
        const settingsResponse = await axios.get(`${baseURL}/settings`, { headers });
        console.log('Settings:', JSON.stringify(settingsResponse.data.settings, null, 2));

        const currentYearId = settingsResponse.data.settings?.current_year_id || 1;
        const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1;

        // Generate roster
        console.log(`\n3. Generating roster for class ${user.homeroom_class_id}...`);
        const rosterResponse = await axios.get(
            `${baseURL}/reports/roster/${user.homeroom_class_id}?year_id=${currentYearId}&semester_id=${currentSemesterId}`,
            { headers }
        );

        console.log('\n✅ Roster generated successfully!');
        console.log('Class Info:', JSON.stringify(rosterResponse.data.class_info, null, 2));
        console.log('Total Students:', rosterResponse.data.total_students);
        console.log('Passed:', rosterResponse.data.passed_students);
        console.log('Failed:', rosterResponse.data.failed_students);
        console.log('\nStudents:');
        rosterResponse.data.students.forEach(student => {
            console.log(`  - ${student.student_name}: Total=${student.total}, Avg=${student.average}, Rank=${student.rank}, Status=${student.status}`);
        });

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

testRosterGeneration();
