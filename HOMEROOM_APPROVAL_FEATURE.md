# Homeroom Teacher Mark Approval Feature

## Overview

This feature allows homeroom teachers to review and approve all marks submitted by subject teachers before generating the student roster.

## Workflow

### 1. Subject Teachers Submit Marks

Subject teachers enter marks for their assigned classes and subjects:
1. Navigate to "Enter Marks" page
2. Select their class and subject
3. Enter marks for all students
4. Click "Save as Draft" to save marks
5. Click "Submit to Homeroom Teacher" to submit marks for approval

### 2. Homeroom Teacher Reviews Submissions

Homeroom teachers can view all submitted marks:
1. Login as homeroom teacher
2. Navigate to Dashboard
3. Click "Approve Marks" card
4. View submission summary showing:
   - Which subjects have been submitted
   - Which teachers submitted marks
   - How many marks submitted vs total students
   - Completion status for each subject

### 3. Homeroom Teacher Approves All Marks

Once all subject teachers have submitted their marks:
1. Review the detailed marks by subject
2. Click "Approve All Submitted Marks" button
3. Confirm the approval
4. All submitted marks change status from 'submitted' to 'approved'

### 4. Generate Roster

After approving marks:
1. Navigate to "Generate Roster" page
2. Only approved marks will be included in the roster
3. Generate and print the student academic report

## Database Changes

### New Column: `approved_at`

Added to the `marks` table to track when homeroom teacher approved the marks:

```sql
ALTER TABLE marks 
ADD COLUMN approved_at TIMESTAMP NULL AFTER submitted_at;
```

### Mark Status Flow

1. **draft** - Teacher has entered marks but not submitted
2. **submitted** - Teacher submitted marks to homeroom teacher
3. **approved** - Homeroom teacher approved the marks

## API Endpoints

### GET /api/marks/homeroom/submitted

Get all submitted marks for homeroom teacher's class.

**Access**: Homeroom teachers only

**Query Parameters**:
- `year_id` - Academic year ID
- `semester_id` - Semester ID

**Response**:
```json
{
  "success": true,
  "class_id": 2,
  "marks": [...],
  "summary": [
    {
      "subject_id": 1,
      "subject_name": "Mathematics",
      "teacher_name": "John Doe",
      "submitted_count": 25,
      "total_students": 30
    }
  ]
}
```

### POST /api/marks/homeroom/approve-all

Approve all submitted marks for homeroom teacher's class.

**Access**: Homeroom teachers only

**Request Body**:
```json
{
  "year_id": 1,
  "semester_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "45 marks approved successfully",
  "approved_count": 45
}
```

## Frontend Components

### HomeroomApproval.jsx

New page component for homeroom teachers to:
- View submission summary by subject
- See detailed marks for each subject
- Approve all submitted marks at once

**Route**: `/homeroom/approval`

### Dashboard Updates

Added new action card for homeroom teachers:
- **Approve Marks** - Navigate to approval page
- Shows between "Manage Students" and "Generate Roster"

## User Interface

### Submission Summary Table

Shows overview of all subject submissions:
- Subject name
- Teacher name
- Number of submitted marks
- Total students in class
- Completion status (Complete/Incomplete)

### Detailed Marks by Subject

Shows all submitted marks grouped by subject:
- Student code
- Student name
- Mark value
- Submitted by (teacher name)
- Submission timestamp

### Approve All Button

Large green button to approve all submitted marks:
- Disabled while processing
- Shows confirmation dialog
- Updates all marks to 'approved' status
- Displays success message with count

## Testing

### Test as Subject Teacher

1. Login as `iba1` (Chemistry teacher)
2. Go to "Enter Marks"
3. Select Grade 9A - Chemistry
4. Enter marks for all students
5. Click "Submit to Homeroom Teacher"

### Test as Homeroom Teacher

1. Login as `ibsa0` (Grade 9A homeroom teacher)
2. Go to "Approve Marks"
3. Verify Chemistry marks appear in summary
4. Review detailed marks
5. Click "Approve All Submitted Marks"
6. Verify success message

### Test Roster Generation

1. After approving marks
2. Go to "Generate Roster"
3. Verify only approved marks appear in roster
4. Generate and print report

## Benefits

1. **Quality Control**: Homeroom teacher reviews all marks before finalizing
2. **Visibility**: Clear overview of which subjects have submitted marks
3. **Workflow**: Structured process from submission to approval to roster
4. **Tracking**: Timestamps for submission and approval
5. **Bulk Action**: Approve all marks at once instead of one by one

## Future Enhancements

Potential improvements:
- Allow homeroom teacher to reject marks and request resubmission
- Add comments/notes for mark rejections
- Email notifications when marks are submitted
- Individual mark approval (not just bulk)
- History of approvals and rejections
