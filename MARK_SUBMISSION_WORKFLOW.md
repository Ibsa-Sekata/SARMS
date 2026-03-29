# Mark Submission Workflow - Complete Implementation

## Overview
Teachers can now enter marks, save them as drafts, edit them, and submit them to homeroom teachers. Homeroom teachers can only see marks that have been submitted.

## New Features

### 1. Mark Status System
- **Draft**: Marks saved by teacher but not yet submitted to homeroom
- **Submitted**: Marks submitted to homeroom teacher (visible to homeroom)

### 2. Teacher Workflow

#### Step 1: Enter Marks
1. Teacher logs in and goes to "Enter Marks"
2. Selects their assigned class and subject
3. Enters marks for students (0-100)
4. Clicks "Save as Draft"
5. Marks are saved with status = 'draft'

#### Step 2: Edit Marks (Optional)
1. Teacher can return to the same class
2. Previously entered marks are pre-filled
3. Teacher can edit any draft marks
4. Clicks "Save as Draft" again to update

#### Step 3: Submit to Homeroom
1. When ready, teacher clicks "Submit to Homeroom Teacher"
2. All draft marks for that class/subject change to status = 'submitted'
3. Homeroom teacher can now see these marks
4. Teacher can still edit submitted marks if needed

### 3. Homeroom Teacher View
- Homeroom teachers only see marks with status = 'submitted'
- Can generate rosters with submitted marks
- Cannot see draft marks from subject teachers

## Database Changes

### New Fields in `marks` Table:
```sql
status ENUM('draft', 'submitted') DEFAULT 'draft'
submitted_at TIMESTAMP NULL
```

### Migration Script:
Run: `database/add_mark_status.sql`

## API Endpoints

### 1. Save Marks as Draft
```
POST /api/marks/batch
Body: {
  marks: [
    {
      student_id: 1,
      subject_id: 1,
      teacher_id: 1,
      semester_id: 1,
      year_id: 2,
      mark: 85
    }
  ]
}
Response: { success: true, message: "X marks saved as draft" }
```

### 2. Submit to Homeroom Teacher
```
POST /api/marks/submit-to-homeroom
Body: {
  class_id: 1,
  subject_id: 1,
  year_id: 2,
  semester_id: 1
}
Response: { 
  success: true, 
  message: "X marks submitted to homeroom teacher",
  submitted_count: 25
}
```

### 3. Get Marks (with Status Filter)
```
GET /api/marks?class_id=1&subject_id=1&year_id=2&semester_id=1&status=draft
Response: {
  success: true,
  marks: [
    {
      mark_id: 1,
      student_id: 1,
      mark: 85,
      status: 'draft',
      submitted_at: null,
      ...
    }
  ]
}
```

## Frontend Changes

### Mark Entry Page (`MarkEntry.jsx`)

#### New State Variables:
- `existingMarks`: Stores existing marks with their status
- `submitting`: Loading state for homeroom submission
- `selectedSubject`: Tracks selected subject ID

#### New Functions:
- `loadExistingMarks()`: Loads existing marks and pre-fills inputs
- `submitToHomeroom()`: Submits marks to homeroom teacher

#### UI Updates:
- Added "Status" column showing Draft/Submitted/Not entered
- "Save as Draft" button (saves marks without submitting)
- "Submit to Homeroom Teacher" button (changes status to submitted)
- Disabled inputs for submitted marks (can still be edited by changing status back)
- Pre-filled inputs with existing mark values

## User Experience

### For Subject Teachers:

1. **First Time Entry**:
   - Select class and subject
   - Enter marks for all students
   - Click "Save as Draft"
   - Status shows "Draft" for all students

2. **Editing Draft Marks**:
   - Return to same class/subject
   - Marks are pre-filled
   - Edit any marks
   - Click "Save as Draft" to update

3. **Submitting to Homeroom**:
   - Click "Submit to Homeroom Teacher"
   - Confirmation dialog appears
   - All draft marks become "Submitted"
   - Homeroom teacher can now see them

4. **After Submission**:
   - Marks still visible to teacher
   - Status shows "✓ Submitted"
   - Can still edit if needed (saves as draft again)

### For Homeroom Teachers:

1. **Viewing Submitted Marks**:
   - Go to "Generate Roster"
   - Select academic year and semester
   - Click "Generate Roster"
   - See all submitted marks from subject teachers

2. **What They See**:
   - Only marks with status = 'submitted'
   - Draft marks are hidden
   - Complete roster with all subjects

3. **What They Don't See**:
   - Draft marks from subject teachers
   - Marks that haven't been submitted yet

## Access Control

### Subject Teachers:
- Can see their own marks (draft or submitted)
- Can edit their own marks
- Can submit their marks to homeroom
- Cannot see other teachers' marks

### Homeroom Teachers:
- Can see only submitted marks for their class
- Cannot see draft marks
- Can generate rosters with submitted marks
- Cannot edit subject teachers' marks

### Admin:
- Can see all marks (draft and submitted)
- Can edit any marks
- Full access to all classes

## Backend Logic

### Mark Creation (Draft):
```javascript
// Saves mark with status = 'draft'
INSERT INTO marks (..., status) VALUES (..., 'draft')
ON DUPLICATE KEY UPDATE mark = ?, status = 'draft'
```

### Submit to Homeroom:
```javascript
// Changes all draft marks to submitted for class/subject
UPDATE marks 
SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
WHERE teacher_id = ? 
  AND subject_id = ? 
  AND class_id = ?
  AND status = 'draft'
```

### Get Marks (Filtered by Role):
```javascript
// Subject teacher: see own marks
WHERE m.teacher_id = ?

// Homeroom teacher: see only submitted marks for their class
WHERE s.class_id = ? AND m.status = 'submitted'

// Admin: see all marks
WHERE 1=1
```

## Testing

### Test as Subject Teacher:

1. Login as subject teacher (e.g., sarah.johnson)
2. Go to "Enter Marks"
3. Select a class you're assigned to
4. Enter marks for students
5. Click "Save as Draft"
6. Verify status shows "Draft"
7. Refresh page and verify marks are pre-filled
8. Edit some marks
9. Click "Save as Draft" again
10. Click "Submit to Homeroom Teacher"
11. Verify status changes to "✓ Submitted"

### Test as Homeroom Teacher:

1. Login as homeroom teacher
2. Go to "Generate Roster"
3. Select year and semester
4. Click "Generate Roster"
5. Verify you see submitted marks from subject teachers
6. Verify you don't see draft marks

### Test Mark Visibility:

1. Subject teacher enters marks but doesn't submit
2. Homeroom teacher generates roster
3. Those marks should NOT appear
4. Subject teacher submits marks
5. Homeroom teacher generates roster again
6. Now marks should appear

## Files Modified

### Backend:
- `database/add_mark_status.sql` - Database migration
- `backend/controllers/markController.js` - Added status handling and submitToHomeroom
- `backend/routes/markRoutes.js` - Added submit-to-homeroom route

### Frontend:
- `frontend/src/pages/MarkEntry.jsx` - Complete UI overhaul with status display

## Benefits

1. **Teachers can work at their own pace**: Save drafts and come back later
2. **No accidental submissions**: Explicit "Submit to Homeroom" action required
3. **Marks are always visible**: Teachers can see their entered marks anytime
4. **Homeroom sees only final marks**: No confusion from incomplete data
5. **Audit trail**: submitted_at timestamp tracks when marks were submitted
6. **Flexible editing**: Teachers can edit marks even after submission

## Status
✅ Database migration complete
✅ Backend API implemented
✅ Frontend UI updated
✅ Access control enforced
✅ Mark status tracking working
✅ Submit to homeroom functionality working
✅ Pre-fill existing marks working
✅ Status display working
