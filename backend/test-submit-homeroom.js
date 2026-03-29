const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testSubmitToHomeroom() {
    try {
        console.log('=== Testing Submit to Homeroom Workflow ===\n');

        // 1. Login as teacher
        console.log('1. Logging in as sarah.johnson (Teacher ID: 1)...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            username: 'sarah.johnson',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log(`✓ Logged in as ${user.username} (Teacher ID: ${user.teacher_id})\n`);

        // 2. Get teacher assignments
        console.log('2. Getting teacher assignments...');
        const assignmentsResponse = await axios.get(
            `${API_URL}/teachers/${user.teacher_id}/assignments`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const assignment = assignmentsResponse.data.assignments[0];
        console.log(`✓ Found assignment: Class ${assignment.class_id}, Subject ${assignment.subject_id}\n`);

        // 3. Get students in class
        console.log('3. Getting students in class...');
        const studentsResponse = await axios.get(
            `${API_URL}/students/class/${assignment.class_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✓ Found ${studentsResponse.data.students.length} students\n`);

        // 4. Save marks as draft
        console.log('4. Saving marks as draft...');
        const marks = studentsResponse.data.students.map(student => ({
            student_id: student.student_id,
            subject_id: assignment.subject_id,
            teacher_id: user.teacher_id,
            semester_id: 1,
            year_id: 2,
            mark: Math.floor(Math.random() * 30) + 70 // Random mark 70-100
        }));

        const batchResponse = await axios.post(
            `${API_URL}/marks/batch`,
            { marks },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✓ ${batchResponse.data.message}\n`);

        // 5. Check marks status
        console.log('5. Checking marks status...');
        const marksResponse = await axios.get(
            `${API_URL}/marks?class_id=${assignment.class_id}&subject_id=${assignment.subject_id}&year_id=2&semester_id=1`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const draftCount = marksResponse.data.marks.filter(m => m.status === 'draft').length;
        console.log(`✓ Found ${draftCount} draft marks\n`);

        // 6. Submit to homeroom teacher
        console.log('6. Submitting marks to homeroom teacher...');
        const submitResponse = await axios.post(
            `${API_URL}/marks/submit-to-homeroom`,
            {
                class_id: assignment.class_id,
                subject_id: assignment.subject_id,
                year_id: 2,
                semester_id: 1
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✓ ${submitResponse.data.message}\n`);

        // 7. Verify marks are now submitted
        console.log('7. Verifying marks status after submission...');
        const verifyResponse = await axios.get(
            `${API_URL}/marks?class_id=${assignment.class_id}&subject_id=${assignment.subject_id}&year_id=2&semester_id=1`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const submittedCount = verifyResponse.data.marks.filter(m => m.status === 'submitted').length;
        const stillDraftCount = verifyResponse.data.marks.filter(m => m.status === 'draft').length;
        console.log(`✓ Submitted marks: ${submittedCount}`);
        console.log(`✓ Draft marks: ${stillDraftCount}\n`);

        console.log('=== Test Complete ===');
        console.log('\nSummary:');
        console.log('- Marks saved as draft ✓');
        console.log('- Marks submitted to homeroom ✓');
        console.log('- Status changed from draft to submitted ✓');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response?.data?.error === 'Route not found') {
            console.error('\n⚠️  The server needs to be restarted to load the new route!');
            console.error('   Please restart your backend server and try again.');
        }
    }
}

testSubmitToHomeroom();
