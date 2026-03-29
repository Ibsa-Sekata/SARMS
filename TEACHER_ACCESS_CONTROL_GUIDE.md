# Teacher Access Control System

## Overview

I've implemented proper access control so that teachers can ONLY see and manage students in classes they're assigned to teach.

---

## Access Control Rules

### Admin
- ✅ Can see ALL students
- ✅ Can manage all classes
- ✅ Can enter marks for any student/subject
- ✅ Full system access

### Subject Teacher (Normal Teacher)
- ✅ Can ONLY see students in classes they're assigned to teach
- ✅ Can ONLY enter marks for their assigned subject
- ✅ Can ONLY edit marks for their assigned subject
- ❌ Cannot see students in other classes
- ❌ Cannot enter marks for subjects they don't teach

### Homeroom Teacher
- ✅ Can see ALL students in their assigned class
- ✅ Can view all marks for their class
- ✅ Can generate class reports
- ✅ Can collect marks from all subject teachers

---

## How It Works

### 1. Teacher Assignments

Teachers must be assigned to classes before they can see students:

**Admin assigns teacher**:
```
Teacher: Dr. Sarah Johnson (Mathematics Department)
Subject: Mathematics
Class: Grade 9A
Year: 2024
```

**Result**: Dr. Sarah Johnson can now:
- See students in Grade 9A
- Enter Mathematics marks for Grade 9A students
- Edit Mathematics marks for Grade 9A students

### 2. Student Visibility

**Before Assignment**:
- Teacher logs in
- Goes to "View Students" or "Enter Marks"
- Sees: **No students** (empty list)

**After Assignment**:
- Admin assigns teacher to Grade 9A for Mathematics
- Teacher refreshes page
- Sees: **All students in Grade 9A**

### 3. Mark Entry Access Control

**Scenario 1: Correct Assignment**
```
Teacher: Dr. Sarah Johnson
Assigned: Mathematics → Grade 9A
Action: Enter Mathematics mark for Grade 9A student
Result: ✅ Success - Mark saved
```

**Scenario 2: Wrong Subject**
```
Teacher: Dr. Sarah Johnson
Assigned: Mathematics → Grade 9A
Action: Enter English mark for Grade 9A student
Result: ❌ Error - "You are not assigned to teach this subject to this class"
```

**Scenario 3: Wrong Class**
```
Teacher: Dr. Sarah Johnson
Assigned: Mathematics → Grade 9A
Action: Enter Mathematics mark for Grade 9B student
Result: ❌ Error - Student not visible (not in assigned class)
```

---

## Database Structure

### Teacher Assignments Table

```sql
CREATE TABLE teacher_assignments (
    assignment_id INT PRIMARY KEY,
    teacher_id INT,              -- Which teacher
    subject_id INT,              -- Which subject they teach
    class_id INT,                -- Which class
    year_id INT,                 -- Which academic year
    UNIQUE (teacher_id, subject_id, class_id, year_id)
);
```

**Example Data**:
```
| teacher_id | subject_id | class_id | year_id |
|------------|------------|----------|---------|
| 1          | 1          | 1        | 2       | -- Dr. Sarah teaches Math to 9A in 2024
| 1          | 1          | 2        | 2       | -- Dr. Sarah teaches Math to 9B in 2024
| 2          | 2          | 1        | 2       | -- Prof. Michael teaches English to 9A in 2024
```

---

## API Access Control

### GET /api/students

**Admin Request**:
```
GET /api/students
Authorization: Bearer <admin_token>
```
**Response**: All students in database

**Teacher Request**:
```
GET /api/students
Authorization: Bearer <teacher_token>
```
**Response**: Only students in classes teacher is assigned to

### GET /api/students/class/:classId

**Teacher Request**:
```
GET /api/students/class/1
Authorization: Bearer <teacher_token>
```

**Check**:
1. Is teacher assigned to class 1?
2. If YES → Return students
3. If NO → Return 403 Forbidden

### POST /api/marks

**Teacher Request**:
```json
{
  "student_id": 5,
  "subject_id": 1,
  "mark": 85
}
```

**Validation**:
1. Get student's class_id
2. Check if teacher is assigned to teach subject_id to that class
3. If YES → Save mark
4. If NO → Return 403 Forbidden

---

## Workflow Example

### Complete Flow: Subject Teacher

**Step 1: Admin Assigns Teacher**
```
Admin Dashboard → Manage Classes → Assign Teacher
- Class: Grade 9A
- Teacher: Dr. Sarah Johnson
- Subject: Mathematics
- Click: Assign Teacher
```

**Step 2: Teacher Logs In**
```
Username: sarah.johnson
Password: password123
```

**Step 3: Teacher Views Classes**
```
Dashboard → Enter Marks
Sees: Grade 9A - Mathematics
```

**Step 4: Teacher Selects Class**
```
Select: Grade 9A - Mathematics
Sees: List of all students in Grade 9A
```

**Step 5: Teacher Enters Marks**
```
Student 1: 85
Student 2: 90
Student 3: 78
Click: Submit Marks
Result: ✅ Success - Marks saved
```

**Step 6: Marks Submitted to Homeroom**
```
Marks are now in database
Homeroom teacher can view all marks
Homeroom teacher can generate reports
```

---

## Security Features

### 1. Database-Level Access Control
- Teachers can only query students in assigned classes
- SQL queries filter by teacher_assignments table
- No way to bypass through API

### 2. API-Level Validation
- Every request checks teacher assignments
- Returns 403 Forbidden if not authorized
- Detailed error messages for debugging

### 3. Frontend-Level Filtering
- Teachers only see assigned classes in dropdowns
- Students list filtered by assignments
- No UI elements for unauthorized actions

---

## Testing Access Control

### Test 1: Teacher Without Assignments

**Setup**:
- Create teacher: john.doe
- Do NOT assign to any class

**Test**:
1. Login as john.doe
2. Go to "Enter Marks"
3. Expected: No classes in dropdown
4. Expected: No students visible

### Test 2: Teacher With One Assignment

**Setup**:
- Assign john.doe to Grade 9A for Mathematics

**Test**:
1. Login as john.doe
2. Go to "Enter Marks"
3. Expected: Only "Grade 9A - Mathematics" in dropdown
4. Select Grade 9A
5. Expected: All students in Grade 9A visible
6. Enter Mathematics marks
7. Expected: Success

### Test 3: Teacher Tries Wrong Subject

**Setup**:
- john.doe assigned to Grade 9A for Mathematics only

**Test**:
1. Try to enter English mark (via API)
2. Expected: 403 Forbidden error
3. Expected: "You are not assigned to teach this subject to this class"

### Test 4: Multiple Assignments

**Setup**:
- Assign john.doe to:
  - Grade 9A for Mathematics
  - Grade 9B for Mathematics
  - Grade 10A for Mathematics

**Test**:
1. Login as john.doe
2. Go to "Enter Marks"
3. Expected: 3 classes in dropdown
4. Can enter marks for all 3 classes
5. Can only enter Mathematics marks

---

## Homeroom Teacher Special Access

### Homeroom Teacher Privileges

**Assigned as Homeroom**:
```sql
UPDATE classes 
SET homeroom_teacher_id = 1 
WHERE class_id = 1;
```

**Can Do**:
- View ALL students in their class
- View ALL marks for their class (all subjects)
- Generate class reports
- See class statistics
- Print rosters

**Cannot Do**:
- Enter marks for subjects they don't teach
- View students in other classes
- Modify other teachers' marks

---

## Error Messages

### "You are not assigned to teach this subject to this class"
**Cause**: Teacher trying to enter marks for subject/class they're not assigned to
**Solution**: Admin must assign teacher to that subject/class

### "No students found"
**Cause**: Teacher has no class assignments
**Solution**: Admin must assign teacher to classes

### "403 Forbidden"
**Cause**: Teacher trying to access unauthorized resource
**Solution**: Check teacher assignments

---

## Admin Checklist

Before teachers can use the system:

- [ ] Create teacher account
- [ ] Assign teacher to department
- [ ] Create classes (grade + section)
- [ ] Assign homeroom teacher to class
- [ ] Assign subject teachers to classes
- [ ] Verify assignments in database
- [ ] Test teacher login
- [ ] Verify teacher can see students
- [ ] Verify teacher can enter marks

---

## Benefits

1. **Security**: Teachers can't access unauthorized data
2. **Privacy**: Students' data protected by access control
3. **Accuracy**: Teachers only enter marks for subjects they teach
4. **Accountability**: All marks tracked by teacher_id
5. **Scalability**: Works with any number of teachers/classes

---

## Technical Implementation

### Backend Changes

**Files Modified**:
- `backend/controllers/studentController.js` - Added assignment-based filtering
- `backend/controllers/markController.js` - Added assignment validation

**Key Functions**:
- `getStudents()` - Filters by teacher assignments
- `getStudentsByClass()` - Checks teacher access to class
- `createMark()` - Validates teacher can teach subject to class
- `submitMarks()` - Batch validation for all marks

### SQL Queries

**Get Students for Teacher**:
```sql
SELECT DISTINCT s.*
FROM students s
WHERE s.class_id IN (
    SELECT DISTINCT class_id 
    FROM teacher_assignments 
    WHERE teacher_id = ?
)
```

**Check Teacher Assignment**:
```sql
SELECT assignment_id 
FROM teacher_assignments 
WHERE teacher_id = ? 
  AND subject_id = ? 
  AND class_id = ? 
  AND year_id = ?
```

---

## Support

If teachers can't see students:
1. Check if teacher is assigned to classes
2. Run: `SELECT * FROM teacher_assignments WHERE teacher_id = ?`
3. Verify assignments exist
4. Check academic year matches current year

If marks fail to save:
1. Check teacher assignment for that subject/class
2. Check backend console for detailed error
3. Verify student is in assigned class
4. Verify subject matches assignment
