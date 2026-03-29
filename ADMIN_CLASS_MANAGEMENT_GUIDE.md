# Admin Class Management Guide

## Overview

I've implemented comprehensive class management features for administrators. Admins can now:

1. ✅ Create classes (all grade/section combinations)
2. ✅ Assign homeroom teachers to classes
3. ✅ Assign subject teachers to classes
4. ✅ View all assignments

---

## Features Implemented

### 1. Create Classes

**Location**: Admin Dashboard → Manage Classes → "+ Create Class"

**What it does**:
- Creates a new class by combining a grade and section
- Optionally assigns a homeroom teacher during creation
- Prevents duplicate classes (same grade + section)

**Example**:
- Grade: 9
- Section: A
- Homeroom Teacher: Dr. Sarah Johnson
- Result: Grade 9A with Dr. Sarah Johnson as homeroom teacher

---

### 2. Assign Homeroom Teachers

**Location**: Admin Dashboard → Manage Classes → Class row → "Assign Teachers"

**What it does**:
- Assigns one homeroom teacher per class
- Homeroom teachers are responsible for their class
- Can be updated at any time

**Rules**:
- One homeroom teacher per class
- Homeroom teacher must be from the teachers list
- Can be left empty initially

---

### 3. Assign Subject Teachers

**Location**: Admin Dashboard → Manage Classes → "+ Assign Teacher"

**What it does**:
- Assigns a teacher to teach a specific subject in a specific class
- Teachers are assigned based on their department
- Multiple teachers can be assigned to one class (one per subject)

**Example Assignment**:
- Class: Grade 9A
- Teacher: Dr. Sarah Johnson (Mathematics Department)
- Subject: Mathematics
- Result: Dr. Sarah Johnson will teach Mathematics to Grade 9A

**Rules**:
- One teacher per subject per class
- Teachers should teach subjects in their department
- Prevents duplicate assignments (same teacher + subject + class)

---

## Backend API Endpoints

### Classes

```
GET    /api/classes                    - Get all classes
POST   /api/classes                    - Create new class
GET    /api/classes/:id                - Get single class
PUT    /api/classes/:id/homeroom       - Update homeroom teacher
GET    /api/classes/:id/students       - Get students in class
```

### Grades & Sections

```
GET    /api/grades                     - Get all grades (5-12)
GET    /api/sections                   - Get all sections (A-D)
```

### Teacher Assignments

```
GET    /api/teacher-assignments        - Get all assignments
POST   /api/teacher-assignments        - Create assignment
DELETE /api/teacher-assignments/:id    - Delete assignment
```

---

## Database Structure

### Classes Table
```sql
CREATE TABLE classes (
    class_id INT PRIMARY KEY,
    grade_id INT,                    -- Links to grades table
    section_id INT,                  -- Links to sections table
    homeroom_teacher_id INT,         -- Links to teachers table
    FOREIGN KEY (grade_id) REFERENCES grades(grade_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id),
    FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(teacher_id)
);
```

### Teacher Assignments Table
```sql
CREATE TABLE teacher_assignments (
    assignment_id INT PRIMARY KEY,
    teacher_id INT,                  -- Which teacher
    subject_id INT,                  -- Which subject
    class_id INT,                    -- Which class
    year_id INT,                     -- Which academic year
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (year_id) REFERENCES academic_years(year_id),
    UNIQUE (teacher_id, subject_id, class_id, year_id)
);
```

---

## Usage Workflow

### Step 1: Create All Classes

1. Login as admin
2. Go to "Manage Classes"
3. Click "+ Create Class"
4. For each grade (5-12) and section (A-D):
   - Select Grade: 9
   - Select Section: A
   - Select Homeroom Teacher (optional)
   - Click "Create Class"
5. Repeat for all combinations you need

**Example Classes**:
- Grade 9A, 9B, 9C, 9D
- Grade 10A, 10B, 10C, 10D
- Grade 11A, 11B, 11C, 11D
- Grade 12A, 12B, 12C, 12D

---

### Step 2: Assign Homeroom Teachers

1. In "Manage Classes", find a class
2. Click "Assign Teachers" button
3. Or update during class creation

**Homeroom Teacher Responsibilities**:
- Manages their assigned class
- Can view all students in their class
- Can generate class reports
- Responsible for class roster

---

### Step 3: Assign Subject Teachers

1. Click "+ Assign Teacher"
2. Select Class: Grade 9A
3. Select Teacher: Dr. Sarah Johnson (Mathematics Dept)
4. Select Subject: Mathematics
5. Click "Assign Teacher"

**Repeat for all subjects in each class**:
- Mathematics → Math teacher
- English → English teacher
- Biology → Biology teacher
- Chemistry → Chemistry teacher
- Physics → Physics teacher

**Department-Based Assignment**:
- Mathematics Department → Teaches Mathematics
- English Department → Teaches English
- Biology Department → Teaches Biology
- Chemistry Department → Teaches Chemistry
- Physics Department → Teaches Physics

---

## Example: Complete Setup for Grade 9A

### 1. Create Class
```
Grade: 9
Section: A
Homeroom Teacher: Dr. Sarah Johnson
```

### 2. Assign Subject Teachers
```
Grade 9A + Dr. Sarah Johnson + Mathematics
Grade 9A + Prof. Michael Brown + English
Grade 9A + Dr. Emily Davis + Biology
Grade 9A + Dr. Robert Wilson + Chemistry
Grade 9A + Prof. Lisa Anderson + Physics
```

### Result
- Grade 9A exists
- Dr. Sarah Johnson is homeroom teacher
- 5 subject teachers assigned (one per subject)
- Students can be added to Grade 9A
- Teachers can enter marks for their subjects

---

## Files Modified/Created

### Frontend
- `frontend/src/pages/Admin/ManageClasses.jsx` - Enhanced with forms

### Backend Controllers
- `backend/controllers/classController.js` - Added createClass, updateHomeroomTeacher
- `backend/controllers/gradeController.js` - NEW - Get grades
- `backend/controllers/sectionController.js` - NEW - Get sections
- `backend/controllers/assignmentController.js` - NEW - Manage assignments

### Backend Routes
- `backend/routes/classRoutes.js` - Added POST and PUT routes
- `backend/routes/gradeRoutes.js` - NEW
- `backend/routes/sectionRoutes.js` - NEW
- `backend/routes/assignmentRoutes.js` - NEW

### Backend Server
- `backend/server.js` - Added new route registrations

---

## Testing Checklist

### Test Class Creation
- [ ] Can create Grade 9A
- [ ] Can create Grade 9B
- [ ] Cannot create duplicate Grade 9A
- [ ] Can create class without homeroom teacher
- [ ] Can create class with homeroom teacher

### Test Homeroom Assignment
- [ ] Can assign homeroom teacher to class
- [ ] Can update homeroom teacher
- [ ] Can remove homeroom teacher (set to null)

### Test Subject Teacher Assignment
- [ ] Can assign Math teacher to Grade 9A for Mathematics
- [ ] Can assign English teacher to Grade 9A for English
- [ ] Cannot assign same teacher+subject+class twice
- [ ] Can assign same teacher to multiple classes
- [ ] Can assign multiple teachers to same class (different subjects)

### Test Data Display
- [ ] Classes table shows all classes
- [ ] Classes show correct homeroom teacher
- [ ] Dropdowns populate with correct data
- [ ] Success messages appear after operations

---

## Next Steps

After setting up classes and assignments:

1. **Add Students**: Go to "Manage Students" and assign students to classes
2. **Enter Marks**: Teachers can login and enter marks for their assigned subjects
3. **Generate Reports**: Homeroom teachers can generate class reports
4. **View Assignments**: Teachers can see which classes they're assigned to

---

## Troubleshooting

### "Failed to create class"
- Check if class already exists (same grade + section)
- Verify grades and sections exist in database
- Check backend console for detailed error

### "Failed to assign teacher"
- Check if assignment already exists
- Verify teacher, subject, and class IDs are valid
- Check backend console for detailed error

### Dropdowns are empty
- Run `node verify-database.js` to check data
- Ensure grades, sections, teachers, and subjects exist
- Check browser console for API errors

### Teacher not showing in dropdown
- Verify teacher exists in database
- Check teacher has a department assigned
- Refresh the page

---

## Database Verification

Run this to verify your setup:

```bash
cd backend
node verify-database.js
```

Should show:
- ✅ 8 grades (5-12)
- ✅ 4 sections (A-D)
- ✅ 5 departments
- ✅ Teachers with departments
- ✅ 5 subjects
- ✅ Academic years and semesters

---

## Important Notes

1. **Academic Year**: All assignments use year_id = 2 (2024) by default
2. **Department Matching**: Teachers should teach subjects in their department
3. **Unique Constraints**: Database prevents duplicate assignments
4. **Homeroom vs Subject**: Homeroom teacher can also be a subject teacher
5. **Multiple Classes**: One teacher can teach multiple classes

---

## Support

If you encounter issues:

1. Restart backend server: `npm start`
2. Hard refresh browser: `Ctrl + Shift + R`
3. Check backend console for errors
4. Check browser console for errors
5. Run `node verify-database.js` to verify data
