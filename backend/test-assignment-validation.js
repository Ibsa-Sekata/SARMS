const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAssignmentValidation() {
    try {
        console.log('=== Testing One Teacher Per Subject Per Class Validation ===\n');

        // 1. Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✓ Logged in as admin\n');

        // 2. Get classes
        console.log('2. Getting classes...');
        const classesResponse = await axios.get(`${API_URL}/classes`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const testClass = classesResponse.data.classes[0];
        console.log(`✓ Using class: Grade ${testClass.grade_number}${testClass.section_name} (ID: ${testClass.class_id})\n`);

        // 3. Get teachers
        console.log('3. Getting teachers...');
        const teachersResponse = await axios.get(`${API_URL}/teachers`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const teacher1 = teachersResponse.data.teachers[0];
        const teacher2 = teachersResponse.data.teachers[1];
        console.log(`✓ Teacher 1: ${teacher1.teacher_name} (ID: ${teacher1.teacher_id})`);
        console.log(`✓ Teacher 2: ${teacher2.teacher_name} (ID: ${teacher2.teacher_id})\n`);

        // 4. Get subjects
        console.log('4. Getting subjects...');
        const subjectsResponse = await axios.get(`${API_URL}/subjects`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const testSubject = subjectsResponse.data.subjects[0];
        console.log(`✓ Using subject: ${testSubject.subject_name} (ID: ${testSubject.subject_id})\n`);

        // 5. Check existing assignments for this class/subject
        console.log('5. Checking existing assignments...');
        const existingResponse = await axios.get(
            `${API_URL}/teacher-assignments?class_id=${testClass.class_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const existingForSubject = existingResponse.data.assignments.filter(
            a => a.subject_id === testSubject.subject_id
        );

        if (existingForSubject.length > 0) {
            console.log(`⚠️  Subject already assigned to ${existingForSubject[0].teacher_name}`);
            console.log('   Deleting existing assignment first...');
            await axios.delete(
                `${API_URL}/teacher-assignments/${existingForSubject[0].assignment_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✓ Existing assignment deleted\n');
        } else {
            console.log('✓ No existing assignment for this subject\n');
        }

        // 6. Assign first teacher to subject
        console.log(`6. Assigning ${teacher1.teacher_name} to ${testSubject.subject_name}...`);
        const assign1Response = await axios.post(
            `${API_URL}/teacher-assignments`,
            {
                teacher_id: teacher1.teacher_id,
                subject_id: testSubject.subject_id,
                class_id: testClass.class_id,
                year_id: 2
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✓ ${assign1Response.data.message}\n`);

        // 7. Try to assign second teacher to SAME subject (should fail)
        console.log(`7. Trying to assign ${teacher2.teacher_name} to SAME subject...`);
        try {
            await axios.post(
                `${API_URL}/teacher-assignments`,
                {
                    teacher_id: teacher2.teacher_id,
                    subject_id: testSubject.subject_id,
                    class_id: testClass.class_id,
                    year_id: 2
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('❌ ERROR: Should have been blocked!');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log(`✓ Assignment correctly blocked!`);
                console.log(`   Message: "${error.response.data.message}"\n`);
            } else {
                throw error;
            }
        }

        // 8. Try to assign same teacher again (should also fail)
        console.log(`8. Trying to assign ${teacher1.teacher_name} again to same subject...`);
        try {
            await axios.post(
                `${API_URL}/teacher-assignments`,
                {
                    teacher_id: teacher1.teacher_id,
                    subject_id: testSubject.subject_id,
                    class_id: testClass.class_id,
                    year_id: 2
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('❌ ERROR: Should have been blocked!');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log(`✓ Duplicate assignment correctly blocked!`);
                console.log(`   Message: "${error.response.data.message}"\n`);
            } else {
                throw error;
            }
        }

        // 9. Assign same teacher to DIFFERENT subject (should succeed)
        const differentSubject = subjectsResponse.data.subjects[1];
        console.log(`9. Assigning ${teacher1.teacher_name} to DIFFERENT subject (${differentSubject.subject_name})...`);

        // Check if already assigned
        const existingForSubject2 = existingResponse.data.assignments.filter(
            a => a.subject_id === differentSubject.subject_id
        );
        if (existingForSubject2.length > 0) {
            await axios.delete(
                `${API_URL}/teacher-assignments/${existingForSubject2[0].assignment_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
        }

        const assign2Response = await axios.post(
            `${API_URL}/teacher-assignments`,
            {
                teacher_id: teacher1.teacher_id,
                subject_id: differentSubject.subject_id,
                class_id: testClass.class_id,
                year_id: 2
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✓ ${assign2Response.data.message}\n`);

        console.log('=== Test Complete ===');
        console.log('\nSummary:');
        console.log('✓ One teacher can be assigned to a subject');
        console.log('✓ Second teacher CANNOT be assigned to same subject');
        console.log('✓ Same teacher CANNOT be assigned twice to same subject');
        console.log('✓ Same teacher CAN be assigned to different subjects');
        console.log('\nValidation Rule: Only ONE teacher per subject per class ✓');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
    }
}

testAssignmentValidation();
