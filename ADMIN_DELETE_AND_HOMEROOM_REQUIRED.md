# Admin Delete Functionality & Homeroom Teacher Required

## Changes Implemented

### 1. Homeroom Teacher Now Required When Creating Class

**Before**: Homeroom teacher was optional
**After**: Homeroom teacher is required and must be selected

#### Backend Validation (`classController.js`):
- Validates that homeroom_teacher_id is provided
- Checks if teacher is already a homeroom teacher for another class
- One teacher can only be homeroom teacher for ONE class

#### Frontend (`ManageClasses.jsx`):
- Changed label from "Homeroom Teacher (Optional)" to "Homeroom Teacher (Required)"
- Added `required` attribute to the select field
- Form cannot be submitted without selecting a homeroom teacher

#### Error Messages:
```
"Grade, section, and homeroom teacher are required"
"This teacher is already a homeroom teacher for Grade 9A. A teacher can only be homeroom teacher for one class."
```

### 2. Delete Functionality Added

Admin can now delete:
- ✅ Departments
- ✅ Teachers
- ✅ Students
- ✅ Classes

All with proper validation and cascade checks.

## Delete Functionality Details

### Delete Department

**Endpoint**: `DELETE /api/departments/:id`

**Validation**:
- Cannot delete if department has teachers
- Cannot delete if department has subjects

**Error Messages**:
```
"Cannot delete department. It has X teacher(s). Please reassign or remove teachers first."
"Cannot delete department. It has X subject(s). Please reassign or remove subjects first."
```

**UI**: Red "Delete" button in Manage Departments table

---

### Delete Teacher

**Endpoint**: `DELETE /api/teachers/:id`

**What Happens**:
- Deletes teacher record
- Deletes associated user account (CASCADE)
- Removes teacher assignments (CASCADE)

**Validation**:
- Checks if teacher is a homeroom teacher
- Checks if teacher has active assignments

**UI**: Red "Delete" button in Manage Teachers table
**Confirmation**: "Are you sure you want to delete teacher [name]? This will also delete their user account. This action cannot be undone."

---

### Delete Student

**Endpoint**: `DELETE /api/students/:id`

**What Happens**:
- Deletes student record
- Deletes associated marks (CASCADE)

**UI**: Red "Delete" button in Manage Students table
**Confirmation**: "Are you sure you want to delete student [name]? This action cannot be undone."

---

### Delete Class

**Endpoint**: `DELETE /api/classes/:id`

**Validation**:
- Cannot delete if class has students
- Cannot delete if class has teacher assignments

**Error Messages**:
```
"Cannot delete class. It has X student(s). Please remove or reassign students first."
"Cannot delete class. It has X teacher assignment(s). Please remove assignments first."
```

**UI**: Red "Delete" button in Manage Classes table
**Confirmation**: "Are you sure you want to delete [class name]? This action cannot be undone."

## Files Modified

### Backend:
- `backend/controllers/classController.js` - Made homeroom required, added delete class
- `backend/controllers/departmentController.js` - Added delete department
- `backend/routes/classRoutes.js` - Added DELETE /classes/:id route
- `backend/routes/departmentRoutes.js` - Added DELETE /departments/:id route

### Frontend:
- `frontend/src/pages/Admin/ManageClasses.jsx` - Made homeroom required, added delete button
- `frontend/src/pages/Admin/ManageDepartments.jsx` - Added delete button
- `frontend/src/pages/Admin/ManageTeachers.jsx` - Added delete button
- `frontend/src/pages/Admin/ManageStudents.jsx` - Added delete button

## User Experience

### Creating a Class:
1. Admin clicks "+ Create Class"
2. Selects Grade (required)
3. Selects Section (required)
4. **Must select Homeroom Teacher** (required)
5. Clicks "Create Class"
6. If teacher is already homeroom for another class → Error message
7. If successful → Class created with homeroom teacher assigned

### Deleting Records:

#### Safe Deletion (No Dependencies):
1. Admin clicks red "Delete" button
2. Confirmation dialog appears
3. Admin confirms
4. Record deleted successfully
5. Toast notification: "X deleted successfully!"

#### Blocked Deletion (Has Dependencies):
1. Admin clicks red "Delete" button
2. Confirmation dialog appears
3. Admin confirms
4. Backend checks for dependencies
5. Error message: "Cannot delete X. It has Y dependencies. Please remove dependencies first."
6. Deletion blocked

## Validation Rules

### Homeroom Teacher:
- ✅ Required when creating class
- ✅ One teacher can only be homeroom for one class
- ✅ Can be updated later if needed
- ✅ Validates on both create and update

### Delete Department:
- ❌ Blocked if has teachers
- ❌ Blocked if has subjects
- ✅ Allowed if empty

### Delete Teacher:
- ⚠️ Deletes user account too
- ⚠️ Removes all assignments
- ✅ Always allowed (CASCADE)

### Delete Student:
- ⚠️ Deletes all marks
- ✅ Always allowed (CASCADE)

### Delete Class:
- ❌ Blocked if has students
- ❌ Blocked if has teacher assignments
- ✅ Allowed if empty

## Database Cascade Behavior

### ON DELETE CASCADE:
- `teachers` → `users` (deleting teacher deletes user)
- `students` → `marks` (deleting student deletes marks)
- `teacher_assignments` → `teachers` (deleting teacher deletes assignments)

### ON DELETE SET NULL:
- `classes` → `homeroom_teacher_id` (if teacher deleted, class homeroom set to NULL)
- `students` → `class_id` (if class deleted, student class set to NULL)

## Testing

### Test Homeroom Required:
1. Login as admin
2. Go to "Manage Classes"
3. Click "+ Create Class"
4. Select grade and section
5. Try to submit without selecting homeroom teacher
6. Should see validation error
7. Select homeroom teacher
8. Should create successfully

### Test Delete with Dependencies:
1. Create a department
2. Add a teacher to that department
3. Try to delete the department
4. Should see error: "Cannot delete department. It has 1 teacher(s)..."
5. Delete or reassign the teacher
6. Now department can be deleted

### Test Delete Cascade:
1. Create a student
2. Enter marks for that student
3. Delete the student
4. Student and all their marks should be deleted

## Important Notes

1. **Homeroom teacher is now mandatory** - Cannot create class without one
2. **One teacher, one homeroom** - A teacher can only be homeroom for one class
3. **Delete buttons are red** - Clear visual indication of destructive action
4. **Confirmation dialogs** - Prevents accidental deletion
5. **Cascade deletes** - Some deletions automatically remove related records
6. **Blocked deletes** - Some deletions are prevented if dependencies exist
7. **Clear error messages** - Users know exactly why deletion failed

## Status
✅ Homeroom teacher required when creating class
✅ One teacher per homeroom validation
✅ Delete departments with validation
✅ Delete teachers with cascade
✅ Delete students with cascade
✅ Delete classes with validation
✅ All delete buttons added to UI
✅ Confirmation dialogs implemented
✅ Error messages clear and helpful
