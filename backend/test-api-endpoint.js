const axios = require('axios');

async function testAPIEndpoint() {
    try {
        console.log('=== Testing Homeroom Approval API Endpoint ===\n');

        // First, login as homeroom teacher
        console.log('1. Logging in as homeroom teacher (ibsa0)...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'ibsa0',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✓ Logged in successfully');
        console.log('User:', loginResponse.data.user);

        // Get submitted marks
        console.log('\n2. Fetching submitted marks...');
        const marksResponse = await axios.get('http://localhost:5000/api/marks/homeroom/submitted?year_id=1&semester_id=1', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('\n3. API Response:');
        console.log('Success:', marksResponse.data.success);
        console.log('Class ID:', marksResponse.data.class_id);
        console.log('Marks count:', marksResponse.data.marks?.length || 0);
        console.log('Summary count:', marksResponse.data.summary?.length || 0);

        if (marksResponse.data.marks && marksResponse.data.marks.length > 0) {
            console.log('\nMarks:');
            marksResponse.data.marks.forEach(m => {
                console.log(`  - ${m.student_name} (${m.subject_name}): ${m.mark} by ${m.teacher_name}`);
            });
        }

        if (marksResponse.data.summary && marksResponse.data.summary.length > 0) {
            console.log('\nSummary:');
            marksResponse.data.summary.forEach(s => {
                console.log(`  - ${s.subject_name} by ${s.teacher_name}: ${s.submitted_count}/${s.total_students}`);
            });
        }

        if (marksResponse.data.marks?.length === 0) {
            console.log('\n❌ No marks returned by API!');
            console.log('This means the frontend will show "No marks have been submitted yet"');
        } else {
            console.log('\n✅ API is working correctly!');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

testAPIEndpoint();
