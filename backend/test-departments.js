const db = require('./config/db');

async function testDepartments() {
    try {
        console.log('Testing departments endpoint...');

        const [departments] = await db.execute('SELECT * FROM departments');
        console.log(`Found ${departments.length} departments:`);
        departments.forEach(dept => {
            console.log(`  - ${dept.department_id}: ${dept.department_name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testDepartments();
