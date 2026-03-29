# Class Assignments View - Admin Feature

## Overview
Admin can now view all teacher assignments for each class, showing which teachers teach which subjects in that class.

## New Features

### 1. View Assignments Button
- Each class in the Manage Classes table now has a "View Assignments" button
- Clicking it shows all teachers assigned to that class with their subjects

### 2. Assignments View
Shows:
- Class name (Grade and Section)
- Homeroom teacher name
- Table of all subject teacher assignments:
  - Subject name
  - Teacher name
  - Department name
  - Remove button for each assignment

### 3. Quick Assignment
- "Assign Teacher to This Class" button in assignments view
- Pre-fills the class field
- Admin just selects teacher and subject

### 4. Remove Assignments
- Red "Remove" button for each assignment
- Confirmation dialog before removal
- Refreshes the list after removal

## User Experience

### Viewing Assignments:

1. **Admin goes to "Manage Classes"**
2. **Sees list of all classes**
3. **Clicks "View Assignments" for a class** (e.g., Grade 9A)
4. **Sees assignments view:**
   ```
   Assignments for Grade 9A
   Homeroom Teacher: Sarah Johnson
   
   Subject    | Teacher          | Department   | Actions
   -----------|------------------|--------------|--------
   Mathematics| Sarah Johnson    | Mathematics  | Remove
   English    | Michael Brown    | Languages    | Remove
   Biology    | Emily Davis      | Science      | Remove
   Chemistry  | Robert Wilson    | Science      | Remove
   Physics    | Lisa Anderson    | Science      | Remove
   ```

### Adding Assignment from View:

1. **Click "+ Assign Teacher to This Class"**
2. **Class is pre-selected** (Grade 9A)
3. **Select teacher** (e.g., David Miller)
4. **Select subject** (e.g., History)
5. **Click "Assign Teacher"**
6. **Assignment added and table refreshes**

### Removing Assignment:

1. **Click "Remove" button** next to an assignment
2. **Confirmation dialog**: "Are you sure you want to remove this teacher assignment?"
3. **Click OK**
4. **Assignment removed and table refreshes**

### Navigation:

- **Back button** in assignments view returns to classes list
- **Back button** in classes list returns to dashboard

## Benefits

1. **Clear Overview**: See all assignments for a class at once
2. **Easy Management**: Add/remove assignments from one place
3. **Department Info**: Know which department each teacher belongs to
4. **Homeroom Visible**: Always see who the homeroom teacher is
5. **Quick Actions**: No need to search through all assignments

## Technical Details

### Frontend Changes (`ManageClasses.jsx`):

#### New State:
```javascript
const [classAssignments, setClassAssignments] = useState([])
const [viewingAssignments, setViewingAssignments] = useState(false)
```

#### New Functions:
- `loadClassAssignments(classId)` - Fetches assignments for a class
- `handleViewAssignments(cls)` - Switches to assignments view
- `handleDeleteAssignment(assignmentId)` - Removes an assignment

#### UI Changes:
- Dynamic header based on view (classes list or assignments)
- Conditional rendering of classes table or assignments table
- "View Assignments" button for each class
- "Remove" button for each assignment

### Backend Changes (`assignmentController.js`):

#### Updated Query:
Added `department_name` to the assignments query:
```sql
LEFT JOIN departments d ON t.department_id = d.department_id
```

Now returns:
- assignment_id
- teacher_id, teacher_name
- subject_id, subject_name
- class_id, grade_number, section_name
- department_name
- year_id, year_name

## API Endpoints Used

### GET /api/teacher-assignments?class_id={id}
**Purpose**: Get all assignments for a specific class

**Response**:
```json
{
  "success": true,
  "assignments": [
    {
      "assignment_id": 1,
      "teacher_id": 1,
      "teacher_name": "Sarah Johnson",
      "department_name": "Mathematics",
      "subject_id": 1,
      "subject_name": "Mathematics",
      "class_id": 1,
      "grade_number": 9,
      "section_name": "A",
      "year_id": 2,
      "year_name": "2024"
    }
  ]
}
```

### DELETE /api/teacher-assignments/:id
**Purpose**: Remove a teacher assignment

**Response**:
```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

## Workflow Example

### Scenario: Admin wants to see who teaches what in Grade 9A

1. Login as admin
2. Go to "Manage Classes"
3. Find Grade 9A in the table
4. Click "View Assignments"
5. See:
   - Homeroom Teacher: Sarah Johnson
   - Mathematics: Sarah Johnson (Mathematics Dept)
   - English: Michael Brown (Languages Dept)
   - Biology: Emily Davis (Science Dept)
   - Chemistry: Robert Wilson (Science Dept)
   - Physics: Lisa Anderson (Science Dept)

### Scenario: Admin wants to add History teacher to Grade 9A

1. From assignments view for Grade 9A
2. Click "+ Assign Teacher to This Class"
3. Select Teacher: David Miller
4. Select Subject: History
5. Click "Assign Teacher"
6. History assignment appears in the table

### Scenario: Admin wants to change Math teacher for Grade 9A

1. From assignments view for Grade 9A
2. Find Mathematics row (Sarah Johnson)
3. Click "Remove"
4. Confirm removal
5. Click "+ Assign Teacher to This Class"
6. Select new teacher
7. Select Mathematics
8. Click "Assign Teacher"
9. New teacher now assigned to Mathematics

## Files Modified

### Frontend:
- `frontend/src/pages/Admin/ManageClasses.jsx` - Added assignments view and management

### Backend:
- `backend/controllers/assignmentController.js` - Added department_name to query

## Status
✅ View assignments button added
✅ Assignments view implemented
✅ Shows homeroom teacher
✅ Shows all subject assignments
✅ Shows department for each teacher
✅ Remove assignment functionality
✅ Quick assign from assignments view
✅ Navigation between views working
✅ Department name included in API response

## Important Notes

1. **One teacher per subject per class** - Validation still enforced
2. **Homeroom teacher shown** - Always visible in assignments view
3. **Department info** - Helps admin know teacher's expertise
4. **Quick access** - No need to filter through all assignments
5. **Easy management** - Add/remove from one place

The admin now has a clear, organized view of all teacher assignments for each class!
