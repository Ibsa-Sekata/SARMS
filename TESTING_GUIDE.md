# Student Academic Record Management System - Testing Guide

## System Status: ✅ RE-IMPLEMENTED WITH NEW SCHEMA

The system has been completely re-implemented based on the new database schema with separate users table and improved architecture.

## Database Schema Changes

The new schema includes:
- **users** table - Separate authentication table for admin and teachers
- **grades** table - Grades 5-12
- **sections** table - Sections A-D
- **academic_years** table - Academic year tracking
- **semesters** table - Semester tracking
- **teacher_assignments** table - Explicit teacher-subject-class assignments

## Quick Start

### 1. Database Setup
```bash
# Make sure MySQL is running
# Drop old database if exists
mysql -u root -p -e "DROP DATABASE IF EXISTS SRMS;"
mysql -u root -p -e "DROP DATABASE IF EXISTS school_system;"

# Import the new database schema and sample data
mysql -u root -p < database/schema.sql
mysql -u root -p < database/sample_data.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
Backend will run on: http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on: http://localhost:3000

## Test Accounts

All users use the password: `password123`

### Administrator
- **Username**: `admin`
- **Email**: admin@school.edu
- **Role**: Full system access
- **Can**: Manage teachers, students, classes, subjects, and view all reports

### Homeroom Teachers (Can manage students and generate rosters)
- **Username**: `sarah.johnson`
  - Email: sarah.johnson@school.edu
  - Department: Mathematics
  - Class: Grade 9A

- **Username**: `michael.brown`
  - Email: michael.brown@school.edu
  - Department: English
  - Class: Grade 9B

- **Username**: `emily.davis`
  - Email: emily.davis@school.edu
  - Department: Biology
  - Class: Grade 10A

### Subject Teachers (Can enter marks for their subject)
- **Username**: `david.miller`
  - Email: david.miller@school.edu
  - Department: English
  - Teaches: English to multiple classes

- **Username**: `maria.garcia`
  - Email: maria.garcia@school.edu
  - Department: Biology
  - Teaches: Biology to multiple classes

## Testing Workflows

### Test 1: Admin Login
1. Login with: `admin` / `password123`
2. You should see the admin dashboard with full system access
3. Navigate to manage teachers, students, or classes
4. View system-wide reports

### Test 2: Subject Teacher Login and Mark Entry
1. Login with: `david.miller` / `password123`
2. You should see the dashboard showing classes you teach
3. Navigate to "Enter Marks" page
4. Select a class and enter marks for students
5. Submit marks

### Test 3: Homeroom Teacher Login and Student Management
1. Login with: `sarah.johnson` / `password123`
2. You should see your homeroom class (Grade 9A)
3. Navigate to "Student Management"
4. Try adding a new student to your class
5. Try editing or removing a student

### Test 4: Generate Student Roster
1. Login as homeroom teacher: `sarah.johnson` / `password123`
2. Navigate to "Student Roster" page
3. Select your class (Grade 9A)
4. View the roster with:
   - Student names, IDs, gender
   - Subject marks (Maths, English, Biology, Chemistry, Physics)
   - Total marks (out of 500)
   - Average percentage
   - Rank (automatically calculated)
   - Pass/Fail status (Pass mark = 50%)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (admin or teacher)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Students
- `GET /api/students` - List all students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Add new student (homeroom/admin only)
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Remove student (homeroom/admin only)

### Marks
- `GET /api/marks` - List marks
- `POST /api/marks` - Submit mark
- `PUT /api/marks/:id` - Update mark
- `DELETE /api/marks/:id` - Delete mark

### Reports
- `GET /api/reports/student/:id` - Individual student report
- `GET /api/reports/class/:id` - Class report
- `GET /api/reports/roster/:classId` - Student roster
- `GET /api/reports/class/:id/statistics` - Class statistics

### Classes
- `GET /api/classes` - List all classes
- `GET /api/classes/:id` - Get class details

### Subjects
- `GET /api/subjects` - List all subjects
- `POST /api/subjects` - Add new subject

## Database Configuration

The system uses the following database credentials (from backend/.env):
- Host: localhost
- User: root
- Password: IbsaMysql1
- Database: school_system (NEW)

## Key Features Implemented

✅ Separate users table for authentication
✅ Role-based authentication (Admin, Homeroom Teacher, Subject Teacher)
✅ Grades and sections as separate tables
✅ Academic year and semester tracking
✅ Explicit teacher assignments table
✅ Subject teachers can enter marks for their assigned classes
✅ Homeroom teachers can manage students in their class
✅ Automatic ranking calculation based on total marks
✅ Student roster generation with pass/fail status
✅ Mark validation (0-100 range, pass mark = 50%)
✅ Total marks calculation (5 subjects × 100 = 500)
✅ Average percentage calculation
✅ Interactive dashboard with role-based views
✅ Responsive design for all screen sizes

## Sample Data

The system includes sample data for testing:
- 1 Admin user
- 8 Teachers (4 homeroom, 4 subject)
- 5 Departments (Mathematics, English, Biology, Chemistry, Physics)
- 5 Subjects
- 8 Classes (Grades 9-12, Sections A-B)
- 16 Students across different classes
- Sample marks for Grade 9A students matching the roster format

## Troubleshooting

### "Server error during login"
- Check if MySQL is running
- Verify database credentials in backend/.env
- Ensure database name is `school_system` (not SRMS)
- Run the test-db.js script: `node backend/test-db.js`
- Check backend console for detailed error messages

### Database connection issues
- Ensure MySQL service is running
- Verify password in backend/.env matches your MySQL root password
- Check if school_system database exists: `mysql -u root -p -e "SHOW DATABASES;"`
- Re-run schema.sql and sample_data.sql if needed

### Frontend not connecting to backend
- Verify backend is running on port 5000
- Check frontend/.env has correct API URL: `VITE_API_URL=http://localhost:5000/api`
- Clear browser cache and reload

### Login with username not working
- Make sure you're using username (e.g., `admin`, `sarah.johnson`) not email
- Password for all users is `password123`
- Check browser console for errors

## System Architecture

The system follows a 3-tier architecture:

```
Frontend (React)
     │
     │ API Requests (REST)
     ▼
Backend (Node.js + Express)
     │
     │ SQL Queries
     ▼
Database (MySQL)
```

### User Roles:
1. **Admin** - Full system access, can manage all entities
2. **Homeroom Teacher** - Manages their assigned class, generates rosters
3. **Subject Teacher** - Enters marks for their assigned subject/classes

### Roster Calculation:
- **Total** = Sum of all subject marks (max 500)
- **Average** = Total / 5 subjects
- **Rank** = Calculated using SQL RANK() function based on total marks
- **Status** = PASS if average >= 50%, otherwise FAIL

## Next Steps

1. Test the login functionality with different user accounts
2. Test mark entry as a subject teacher
3. Test student management as a homeroom teacher
4. Generate and view student rosters
5. Verify ranking calculations are correct
6. Test pass/fail status determination
7. Test admin functionality (if implemented)

## Support

If you encounter any issues:
1. Check the browser console for frontend errors
2. Check the backend terminal for server errors
3. Verify database connection with test-db.js
4. Ensure all dependencies are installed (npm install)
5. Make sure you're using the new database name: `school_system`
