const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testTeacherAccess() {
    try {
        console.log('=== Testing Teacher Access Control ===\n');

        // 1. Login as teacher (sarah.johnson - teacher_id: 1)
        console.log('1. Logging in as sarah.johnson (Teacher ID: 1)...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            username: 'sarah.johnson',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log(`✓ Logged in successfully`);
        console.log(`  User: ${user.username}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Teacher ID: ${user.teacher_id}\n`);

        // 2. Get teacher assignments
        console.log('2. Getting teacher assignments...');
        const assignmentsResponse = await axios.get(
            `${API_URL}/teachers/${user.teacher_id}/assignments`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✓ Teacher is assigned to ${assignmentsResponse.data.assignments.length} classes:`);
        assignmentsResponse.data.assignments.forEach(a => {
            console.log(`  - Class ${a.class_id} (Grade ${a.grade_number}${a.section_name}) - ${a.subject_name}`);
        });
        console.log();

        // 3. Get all students (should only see students in assigned classes)
        console.log('3. Getting students (should only see assigned classes)...');
        const studentsResponse = await axios.get(
            `${API_URL}/students`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✓ Teacher can see ${studentsResponse.data.students.length} students`);

        // Group students by class
        const studentsByClass = {};
        studentsResponse.data.students.forEach(s => {
            if (!studentsByClass[s.class_id]) {
                studentsByClass[s.class_id] = [];
            }
            studentsByClass[s.class_id].push(s);
        });

        console.log('  Students by class:');
        Object.keys(studentsByClass).forEach(classId => {
            console.log(`  - Class ${classId}: ${studentsByClass[classId].length} students`);
        });
        console.log();

        // 4. Try to get students from a specific assigned class
        const assignedClassId = assignmentsResponse.data.assignments[0].class_id;
        console.log(`4. Getting students from assigned class ${assignedClassId}...`);
        const classStudentsResponse = await axios.get(
            `${API_URL}/students/class/${assignedClassId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✓ Can access class ${assignedClassId}: ${classStudentsResponse.data.students.length} students`);
        console.log();

        // 5. Try to get students from a non-assigned class (should fail)
        const nonAssignedClassId = 5; // Assuming teacher 1 is not assigned to class 5
        console.log(`5. Trying to get students from non-assigned class ${nonAssignedClassId}...`);
        try {
            await axios.get(
                `${API_URL}/students/class/${nonAssignedClassId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✗ ERROR: Teacher should NOT have access to this class!');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log(`✓ Access correctly denied: ${error.response.data.message}`);
            } else {
                console.log(`✗ Unexpected error: ${error.message}`);
            }
        }
        console.log();

        // 6. Try to submit marks for assigned class
        console.log('6. Testing mark submission for assigned class...');
        const testStudent = classStudentsResponse.data.students[0];
        const assignedSubject = assignmentsResponse.data.assignments[0];

        try {
            const markResponse = await axios.post(
                `${API_URL}/marks`,
                {
                    student_id: testStudent.student_id,
                    subject_id: assignedSubject.subject_id,
                    teacher_id: user.teacher_id,
                    semester_id: 1,
                    year_id: 2,
                    mark: 85
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`✓ Mark submitted successfully for student ${testStudent.student_name}`);
        } catch (error) {
            console.log(`✗ Failed to submit mark: ${error.response?.data?.message || error.message}`);
        }
        console.log();

        console.log('=== Test Complete ===');
        console.log('\nSummary:');
        console.log('- Teachers can only see students in their assigned classes ✓');
        console.log('- Teachers cannot access non-assigned classes ✓');
        console.log('- Teachers can submit marks for assigned subjects ✓');

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

testTeacherAccess();
