# One Teacher Per Subject Per Class - Validation

## Overview
Admin can now only assign ONE teacher to teach a specific subject in a specific class. This prevents multiple teachers from being assigned to the same subject in the same class.

## Validation Rule

### ✅ Allowed:
- One teacher teaching Mathematics in Grade 9A
- Same teacher teaching Mathematics in Grade 9B (different class)
- Same teacher teaching English in Grade 9A (different subject)
- Different teacher teaching English in Grade 9A (different subject)

### ❌ Not Allowed:
- Two teachers teaching Mathematics in Grade 9A (same subject, same class)
- Assigning the same teacher twice to Mathematics in Grade 9A (duplicate)

## How It Works

### Backend Validation (`assignmentController.js`)

When admin tries to assign a teacher:

1. **Check if subject is already assigned** in that class
2. **If yes**: Return error with teacher name who is already assigned
3. **If no**: Allow the assignment

```javascript
// Check if ANY teacher is already assigned to this subject in this class
const [existingAssignment] = await db.execute(`
    SELECT ta.assignment_id, t.teacher_name 
    FROM teacher_assignments ta
    JOIN teachers t ON ta.teacher_id = t.teacher_id
    WHERE ta.subject_id = ? AND ta.class_id = ? AND ta.year_id = ?
`, [subject_id, class_id, year_id]);

if (existingAssignment.length > 0) {
    return res.status(400).json({
        success: false,
        message: `This subject is already assigned to ${existingAssignment[0].teacher_name}. 
                  Only one teacher can teach a subject in a class. 
                  Please remove the existing assignment first.`
    });
}
```

## User Experience

### Scenario 1: First Assignment
1. Admin selects Grade 9A
2. Admin selects Teacher: Sarah Johnson
3. Admin selects Subject: Mathematics
4. Clicks "Assign Teacher"
5. ✅ Success: "Teacher assigned successfully!"

### Scenario 2: Duplicate Assignment Attempt
1. Admin selects Grade 9A
2. Admin selects Teacher: Michael Brown
3. Admin selects Subject: Mathematics (already assigned to Sarah)
4. Clicks "Assign Teacher"
5. ❌ Error: "This subject is already assigned to Sarah Johnson. Only one teacher can teach a subject in a class. Please remove the existing assignment first."

### Scenario 3: Reassigning to Different Teacher
1. Admin removes Sarah Johnson from Mathematics in Grade 9A
2. Admin selects Grade 9A
3. Admin selects Teacher: Michael Brown
4. Admin selects Subject: Mathematics
5. Clicks "Assign Teacher"
6. ✅ Success: "Teacher assigned successfully!"

## Error Messages

### When subject is already assigned:
```
This subject is already assigned to [Teacher Name]. 
Only one teacher can teach a subject in a class. 
Please remove the existing assignment first.
```

### Frontend Display:
- Error appears as a toast notification (red)
- User can see which teacher is currently assigned
- User knows they need to remove existing assignment first

## Database Constraint

The validation is enforced at the application level (not database level) to provide better error messages. However, the database has a unique constraint on:

```sql
UNIQUE KEY unique_assignment (teacher_id, subject_id, class_id, year_id)
```

This prevents the same teacher from being assigned twice to the same subject/class combination.

## Testing

### Test the Validation:

1. **Restart backend server** (to load the updated validation)
   ```bash
   cd backend
   npm start
   ```

2. **Run the test script**:
   ```bash
   node test-assignment-validation.js
   ```

This will:
- Assign a teacher to a subject ✓
- Try to assign another teacher to same subject ✗ (blocked)
- Try to assign same teacher again ✗ (blocked)
- Assign same teacher to different subject ✓ (allowed)

### Manual Testing:

1. Login as admin
2. Go to "Manage Classes"
3. Click "Assign Teacher"
4. Select a class, teacher, and subject
5. Click "Assign Teacher" → Should succeed
6. Try to assign a different teacher to the same subject in the same class
7. Should see error message with current teacher's name

## Workflow for Changing Teacher

If admin wants to change which teacher teaches a subject:

1. **View current assignments** for the class
2. **Delete the existing assignment** (click delete/remove button)
3. **Create new assignment** with different teacher
4. New teacher is now assigned to that subject

## Benefits

1. **Prevents confusion**: Students have only one teacher per subject
2. **Clear responsibility**: One teacher is responsible for marks/grades
3. **Easier scheduling**: No conflicts with multiple teachers
4. **Better error messages**: Admin knows exactly what's wrong
5. **Data integrity**: Ensures consistent teacher-subject-class relationships

## Files Modified

### Backend:
- `backend/controllers/assignmentController.js` - Added validation to check for existing assignments

### Frontend:
- No changes needed - already displays backend error messages via toast

## API Endpoint

### POST /api/teacher-assignments

**Request:**
```json
{
  "teacher_id": 1,
  "subject_id": 1,
  "class_id": 1,
  "year_id": 2
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher assigned successfully",
  "assignment_id": 123
}
```

**Error Response (400) - Subject already assigned:**
```json
{
  "success": false,
  "message": "This subject is already assigned to Sarah Johnson. Only one teacher can teach a subject in a class. Please remove the existing assignment first."
}
```

## Status
✅ Validation implemented
✅ Error messages clear and helpful
✅ Test script created
✅ Works with existing frontend
✅ One teacher per subject per class enforced

## Important Notes

1. **Same teacher, different classes**: A teacher CAN teach the same subject in multiple classes
   - Example: Sarah teaches Math in Grade 9A AND Grade 9B ✓

2. **Same teacher, different subjects**: A teacher CAN teach multiple subjects in the same class
   - Example: Sarah teaches Math AND English in Grade 9A ✓

3. **Different teachers, different subjects**: Multiple teachers CAN teach different subjects in the same class
   - Example: Sarah teaches Math, Michael teaches English in Grade 9A ✓

4. **Different teachers, same subject**: Multiple teachers CANNOT teach the same subject in the same class
   - Example: Sarah AND Michael both teaching Math in Grade 9A ✗

The validation ensures only the last scenario is blocked!
