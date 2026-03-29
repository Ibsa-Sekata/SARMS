# Student Academic Record Management System
## Complete System Documentation

---

## 1. System Overview

The Student Academic Record Management System is a web application used to manage student academic results in a high school.

### System Purpose
The system allows:
- **Administrators** to manage teachers, students, classes, and subjects
- **Teachers** to enter student marks for their assigned subjects
- **Homeroom teachers** to generate the final student roster including total, average, rank, and pass/fail status

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MySQL |
| Authentication | JWT (JSON Web Tokens) |

---

## 2. System Architecture

The system follows a **3-tier architecture**:

```
Frontend (React)
     │
     │ API Request (HTTP/REST)
     ▼
Backend (Node.js + Express)
     │
     │ SQL Queries
     ▼
Database (MySQL)
```

### Architecture Explanation:

**React Frontend**
- User interface
- Forms for entering data
- Dashboard pages
- Role-based views

**Node.js Backend**
- Handles API requests
- Validates users
- Executes SQL queries
- Business logic processing

**MySQL Database**
- Stores system data
- Students, teachers, marks, classes, etc.
- Enforces data integrity

---

## 3. User Roles in the System

The system contains **three main roles**:

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Admin** | System administrator | Manage teachers, students, classes, subjects, view all reports |
| **Homeroom Teacher** | Class homeroom teacher | Manage class students, collect marks, generate rosters |
| **Subject Teacher** | Subject-specific teacher | Enter marks for assigned subject/classes |

### Role Storage
The role is stored in the `users` table.

Example:
| user_id | username | role |
|---------|----------|------|
| 1 | admin | admin |
| 2 | sarah.johnson | teacher |
| 3 | david.miller | teacher |

---

## 4. Login System Workflow

When a user logs in, the system checks their role and loads the correct dashboard.

### Login Flow

```
User enters username + password
         │
         ▼
React sends request to backend
POST /api/auth/login
         │
         ▼
Node.js checks database
(users table)
         │
         ▼
If valid → Generate JWT token
Return user role and info
         │
         ▼
React stores token in localStorage
Redirects user based on role
```

### Authentication Code Example (Backend)

```javascript
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  
  const sql = `
    SELECT u.*, t.teacher_id, t.teacher_name 
    FROM users u
    LEFT JOIN teachers t ON u.user_id = t.user_id
    WHERE u.username=? AND u.password=?
  `;
  
  const [users] = await db.execute(sql, [username, password]);
  
  if(users.length > 0){
    const token = jwt.sign(
      { user_id: users[0].user_id, role: users[0].role },
      'secret-key',
      { expiresIn: '24h' }
    );
    res.json({ success: true, token, user: users[0] });
  } else {
    res.status(401).json({ success: false, message: "Invalid login" });
  }
});
```

---

## 5. Role-Based Dashboards

### 5.1 Admin Dashboard

When an **Admin** logs in, the system opens the Admin Dashboard.

**Admin can:**
- Add departments
- Add teachers
- Add students
- Create classes
- Assign homeroom teachers
- Assign teachers to subjects
- View all reports

**Example pages:**
```
Admin Dashboard
├── Manage Teachers
├── Manage Students
├── Manage Classes
├── Assign Teachers
└── View Reports
```

**Example API routes:**
```
POST /api/teachers
POST /api/students
POST /api/classes
POST /api/teacher-assignments
```

---

### 5.2 Teacher Dashboard

When a **Subject Teacher** logs in, they can:
- View assigned classes
- Enter student marks
- Update marks

**Example workflow:**
```
Teacher login
     │
     ▼
View assigned subjects
     │
     ▼
Select class
     │
     ▼
Enter marks for students
```

**Example page:**
```
Teacher Dashboard
├── My Classes
├── Enter Marks
└── View Students
```

**Example API:**
```
GET /api/teachers/:id/assignments
POST /api/marks
PUT /api/marks/:id
```

**Marks validation:**
```
0 ≤ mark ≤ 100
```

---

### 5.3 Homeroom Teacher Dashboard

A **Homeroom Teacher** is responsible for generating the final class roster.

**They can:**
- View all students in their class
- Collect subject marks from all teachers
- Generate final roster
- Add/remove students from their class

**Roster includes:**
- Student name, gender, ID
- Subject marks (Maths, English, Biology, Chemistry, Physics)
- Total marks (out of 500)
- Average percentage
- Rank (based on total marks)
- Pass/Fail status

**Example page:**
```
Homeroom Dashboard
├── My Class Students
├── Generate Roster
└── Print Report
```

---

## 6. Roster Calculation Logic

The roster is generated using SQL queries and calculations.

### Total Marks

**Formula:**
```
TOTAL = Sum of all subject marks
```

**Example SQL:**
```sql
SELECT 
  student_id, 
  SUM(mark) AS total 
FROM marks 
WHERE year_id = 2 AND semester_id = 1
GROUP BY student_id;
```

---

### Average Marks

**Formula:**
```
AVG = TOTAL / number_of_subjects
```

**Example SQL:**
```sql
SELECT 
  student_id, 
  AVG(mark) AS average 
FROM marks 
WHERE year_id = 2 AND semester_id = 1
GROUP BY student_id;
```

---

### Rank Calculation

Students are ranked based on total marks (highest to lowest).

**Example SQL:**
```sql
SELECT 
  student_id,
  SUM(mark) AS total,
  RANK() OVER (ORDER BY SUM(mark) DESC) AS rank_position
FROM marks
WHERE year_id = 2 AND semester_id = 1
GROUP BY student_id;
```

**Rank handling:**
- Students with equal total marks get the same rank
- Next rank skips numbers (e.g., if two students are rank 1, next is rank 3)

---

### Pass / Fail Status

**Rule:**
```
PASS if average >= 50%
FAIL if average < 50%
```

**Example SQL:**
```sql
SELECT
  student_id,
  AVG(mark) AS average,
  CASE 
    WHEN AVG(mark) >= 50 THEN 'PASS'
    ELSE 'FAIL'
  END AS status
FROM marks
WHERE year_id = 2 AND semester_id = 1
GROUP BY student_id;
```

---

## 7. Backend Implementation (Node + Express)

### Main Folder Structure:

```
backend
│
├── config
│   └── db.js              # Database connection
│
├── routes
│   ├── authRoutes.js      # Login/logout routes
│   ├── teacherRoutes.js   # Teacher management
│   ├── studentRoutes.js   # Student management
│   ├── markRoutes.js      # Mark entry routes
│   └── reportRoutes.js    # Report generation
│
├── controllers
│   ├── authController.js
│   ├── studentController.js
│   ├── markController.js
│   └── reportController.js
│
├── middleware
│   ├── authMiddleware.js  # JWT verification
│   └── errorMiddleware.js # Error handling
│
└── server.js              # Main server file
```

### Example Login Route:

```javascript
// authController.js
const login = async (req, res) => {
  const { username, password } = req.body;
  
  const sql = `
    SELECT * FROM users 
    WHERE username=? AND password=?
  `;
  
  const [result] = await db.execute(sql, [username, password]);
  
  if(result.length > 0){
    const token = jwt.sign(
      { user_id: result[0].user_id },
      'secret-key',
      { expiresIn: '24h' }
    );
    res.json({ success: true, token, user: result[0] });
  } else {
    res.status(401).json({ success: false, message: "Invalid login" });
  }
};
```

---

## 8. Frontend Implementation (React)

### Main Structure:

```
frontend
│
├── pages
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── StudentManagement.jsx
│   ├── MarkEntry.jsx
│   └── StudentRoster.jsx
│
├── contexts
│   └── AuthContext.jsx     # Global auth state
│
├── services
│   └── api.js              # Axios configuration
│
└── App.jsx                 # Main app with routing
```

### Role-Based Routing Example:

```javascript
// App.jsx
function App() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {user && (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {user.role === 'admin' && (
            <>
              <Route path="/teachers" element={<TeacherManagement />} />
              <Route path="/classes" element={<ClassManagement />} />
            </>
          )}
          
          {user.is_homeroom_teacher && (
            <>
              <Route path="/students" element={<StudentManagement />} />
              <Route path="/roster" element={<StudentRoster />} />
            </>
          )}
          
          {user.role === 'teacher' && (
            <Route path="/marks" element={<MarkEntry />} />
          )}
        </>
      )}
    </Routes>
  );
}
```

### Role-Based Navigation Example:

```javascript
if(user.role === "admin"){
  navigate("/admin");
} else if(user.is_homeroom_teacher){
  navigate("/homeroom");
} else if(user.role === "teacher"){
  navigate("/teacher");
}
```

---

## 9. System Workflow Summary

```
Admin
 │
 ├─ Add teachers
 ├─ Add students
 ├─ Create classes
 └─ Assign subjects
 
Subject Teacher
 │
 └─ Enter marks for assigned classes
 
Homeroom Teacher
 │
 └─ Generate roster
      │
      ├─ Total (sum of marks)
      ├─ Average (total / 5)
      ├─ Rank (based on total)
      └─ Pass / Fail (average >= 50%)
```

---

## 10. Security Considerations

The system includes basic security measures:

### Security Features:

1. **User Authentication**
   - JWT token-based authentication
   - Password validation
   - Session management

2. **Role-Based Authorization**
   - Middleware checks user role before allowing access
   - Different permissions for admin, homeroom teacher, and subject teacher

3. **Input Validation**
   - Frontend validation (immediate feedback)
   - Backend validation (security)
   - Database constraints

4. **SQL Constraints**
   - Mark must be between 0 and 100
   - Foreign key constraints
   - Unique constraints on usernames

### Example Validation:

```javascript
// Backend validation
if(mark < 0 || mark > 100){
  return res.status(400).json({
    success: false,
    message: "Mark must be between 0 and 100"
  });
}
```

---

## 11. Database Schema

### Core Tables:

```sql
-- Users (Authentication)
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100),
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','teacher') NOT NULL
);

-- Teachers
CREATE TABLE teachers (
  teacher_id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  department_id INT,
  user_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(department_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Students
CREATE TABLE students (
  student_id INT PRIMARY KEY AUTO_INCREMENT,
  student_name VARCHAR(100) NOT NULL,
  gender ENUM('M','F'),
  student_code VARCHAR(20) UNIQUE,
  class_id INT,
  FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- Marks
CREATE TABLE marks (
  mark_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  subject_id INT,
  teacher_id INT,
  semester_id INT,
  year_id INT,
  mark INT CHECK (mark <= 100),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);
```

---

## 12. Final Report Format

The final student roster matches the format shown in the image:

### ABC HIGH SCHOOL STUDENT ROSTER

**Header Information:**
- School Name: ABC HIGH SCHOOL
- Grade: 9A
- Homeroom Teacher: UJULU
- Academic Year: 2016 | Semester I

**Columns:**
| STUDENT NAME | GENDER | ID | MATHS | ENG | BIO | CHEM | PHY | TOTAL | AVG | RANK | STATUS |
|--------------|--------|-----|-------|-----|-----|------|-----|-------|-----|------|--------|
| STUD 1 | M | ABC001/16 | 88 | 74 | 65 | 90 | 55 | 372 | 74.4 | 1 | PASS |
| STUD 2 | F | ABC002/16 | 77 | 64 | 55 | 80 | 45 | 321 | 64.2 | 2 | PASS |
| STUD 3 | M | ABC003/16 | 66 | 54 | 45 | 70 | 35 | 270 | 54 | 3 | PASS |
| STUD 4 | F | ABC004/16 | 55 | 44 | 35 | 60 | 25 | 219 | 43.8 | 4 | FAIL |

**Notes:**
- SUBJECT LEVEL TOTAL = 100
- OVERALL TOTAL = 500
- PASS MARK = 50%
- Teachers have subject-based department
- The subject will be assigned for one of the teacher from the department
- Homeroom Teacher: a teacher who collects student's mark from subject teachers and prepares a student roster

---

## 13. Conclusion

This Student Academic Record Management System provides a comprehensive solution for managing student academic records with:

✅ Role-based access control
✅ Secure authentication
✅ Automated ranking calculation
✅ Pass/fail determination
✅ Print-ready roster generation
✅ Scalable architecture
✅ User-friendly interface

The system follows industry best practices for web application development and provides a solid foundation for future enhancements.
