# Homeroom Approval Page - Debugging Guide

## Current Status

✅ Database structure is correct (status, submitted_at, approved_at columns exist)
✅ Backend API endpoint is working (`/marks/homeroom/submitted`)
✅ There are 4 submitted marks in the database
✅ Frontend has been redesigned with beautiful UI

## How to Debug

### Step 1: Check Browser Console

1. Open the Homeroom Approval page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for these log messages:
   - "Loading submitted marks with: {currentYearId, currentSemesterId}"
   - "Submitted marks response: {...}"
   - "Loaded marks: X"
   - "Loaded summary: X"

### Step 2: Verify Homeroom Teacher Login

The logged-in user MUST be a homeroom teacher. Check:

```sql
-- Find homeroom teachers
SELECT 
    t.teacher_id,
    t.teacher_name,
    c.class_id,
    g.grade_number,
    sec.section_name
FROM teachers t
JOIN classes c ON c.homeroom_teacher_id = t.teacher_id
JOIN grades g ON c.grade_id = g.grade_id
JOIN sections sec ON c.section_id = sec.section_id;
```

### Step 3: Verify Year and Semester Settings

Check current academic settings:

```sql
SELECT * FROM settings;
```

The `current_year_id` and `current_semester_id` must match the marks:

```sql
-- Check submitted marks
SELECT 
    m.mark_id,
    m.year_id,
    m.semester_id,
    m.status,
    s.student_name,
    sub.subject_name,
    st.class_id
FROM marks m
JOIN students s ON m.student_id = s.student_id
JOIN subjects sub ON m.subject_id = sub.subject_id
JOIN students st ON m.student_id = st.student_id
WHERE m.status = 'submitted';
```

### Step 4: Test the Flow

1. **Login as a subject teacher** (not homeroom)
2. Go to Dashboard → Click on a class → Add Marks
3. Enter marks for students
4. Click "Save Marks" (saves as draft)
5. Click "Submit to Homeroom Teacher"
6. **Logout and login as the homeroom teacher** for that class
7. Go to Dashboard → Click "Approve Marks"
8. You should see the submitted marks

### Step 5: Check Network Tab

1. Open DevTools → Network tab
2. Reload the Approval page
3. Look for the request to `/api/marks/homeroom/submitted`
4. Check the response:
   - Status should be 200
   - Response should have `success: true`
   - Should have `marks` array and `summary` array

## Common Issues

### Issue 1: "You are not a homeroom teacher"

**Solution:** The logged-in user is not assigned as homeroom teacher for any class.

```sql
-- Assign a teacher as homeroom teacher
UPDATE classes 
SET homeroom_teacher_id = <teacher_id>
WHERE class_id = <class_id>;
```

### Issue 2: No marks showing up

**Possible causes:**
- Marks are in 'draft' status (not submitted)
- Year/semester mismatch
- Marks belong to a different class

**Solution:** Check the marks status:

```sql
-- Update draft marks to submitted for testing
UPDATE marks 
SET status = 'submitted', submitted_at = NOW()
WHERE status = 'draft'
AND student_id IN (SELECT student_id FROM students WHERE class_id = <homeroom_class_id>);
```

### Issue 3: Wrong year/semester

**Solution:** Update settings to match your marks:

```sql
UPDATE settings 
SET current_year_id = 1, current_semester_id = 1
WHERE setting_id = 1;
```

## Backend Changes Made

1. ✅ Reverted to original working query (only shows subjects with submitted marks)
2. ✅ Added console logging to backend
3. ✅ Added console logging to frontend

## Frontend Changes Made

1. ✅ Beautiful card-based design for subject summary
2. ✅ Progress bars showing submission status
3. ✅ Color-coded marks (green for pass, red for fail)
4. ✅ Modern table design with alternating rows
5. ✅ Gradient headers for each subject section
6. ✅ Responsive layout

## Next Steps

1. Open the approval page in browser
2. Check console logs
3. Verify the logged-in user is a homeroom teacher
4. Verify year/semester settings match the submitted marks
5. If still not working, check the Network tab for API response
