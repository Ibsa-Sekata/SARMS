# Teacher Mark Entry - Setup Guide

## Issue Fixed
When teachers try to enter marks, the class dropdown was empty because:
1. The `getTeacherAssignments` function was using `year_id = 2` but the database only has `year_id = 1`
2. Teachers need to be assigned to classes first before they can enter marks

## Solution Applied
✅ Updated `getTeacherAssignments` to automatically use the current year from `system_settings`
✅ Added logging to help debug assignment issues
✅ Backend server restarted with the fix

## How It Works

### For Teachers to Enter Marks:
1. **Admin must first assign the teacher to a class:**
   - Go to "Manage Classes"
   - Click "+ Assign Teacher"
   - Select:
     - Class (e.g., Grade 9A)
     - Teacher
     - Subject (Mathematics, English, Biology, Chemistry, or Physics)
   - Click "Assign Teacher"

2. **Teacher can then enter marks:**
   - Login as teacher
   - Go to "Mark Entry"
   - Select the class from dropdown (will show: "Grade 9A - Mathematics")
   - Enter marks for each student (0-100)
   - Click "Save as Draft" to save marks
   - Click "Submit to Homeroom Teacher" when ready

### Current Database State:
- Academic Year: 2018 (year_id = 1)
- Semester: 1st Semester (semester_id = 1)
- Subjects available:
  - Mathematics
  - English
  - Biology
  - Chemistry
  - Physics

## Testing Steps

1. **As Admin:**
   ```
   - Login as admin
   - Go to "Manage Classes"
   - Create a class (e.g., Grade 9, Section A, assign homeroom teacher)
   - Click "+ Assign Teacher"
   - Assign a teacher to teach a subject in that class
   ```

2. **As Teacher:**
   ```
   - Login as the teacher you just assigned
   - Go to "Mark Entry"
   - You should now see the class in the dropdown
   - Select the class
   - Enter marks for students
   - Save as draft or submit to homeroom
   ```

## Important Notes

- Teachers can ONLY see classes they are assigned to teach
- Each teacher can only enter marks for their assigned subject
- Marks must be between 0 and 100
- Teachers can save marks as "draft" and edit them later
- Once submitted to homeroom, marks can still be edited by the teacher
- Homeroom teachers can view all submitted marks for their class

## Files Modified
- `backend/controllers/teacherController.js` - Fixed year_id handling
- `backend/controllers/assignmentController.js` - Fixed year_id handling
- Backend server restarted

## Next Steps
1. Make sure you have assigned teachers to classes
2. Test mark entry as a teacher
3. Verify marks are saved correctly
4. Test submission to homeroom teacher
